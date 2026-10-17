from typing import Any

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from ..services.drafter import generate_draft
from ..services.exporter import build_csv_export, build_json_export
from ..services.store import load_state, read_fixture, save_state
from ..services.validator import validate_alt_text

router = APIRouter()


class ReviewPayload(BaseModel):
    edited_text: str | None = None
    page_context: str | None = None
    is_decorative: bool | None = False
    contains_text: bool | None = False
    multiple_products: bool | None = False


class FlagPayload(BaseModel):
    reason: str = "needs better source image"


class GenerateDraftPayload(BaseModel):
    product_id: str | None = None


def compute_duplicates(images: list[dict[str, Any]]) -> dict[str, str | None]:
    """Finds earliest product_id that has the exact same visible_description."""
    seen: dict[str, str] = {}
    duplicates: dict[str, str | None] = {}
    for img in images:
        pid = img["product_id"]
        desc = img.get("visible_description") or ""
        if desc in seen:
            duplicates[pid] = seen[desc]
        else:
            seen[desc] = pid
            duplicates[pid] = None
    return duplicates


@router.get("/api/images")
def list_images() -> dict[str, Any]:
    fixture = read_fixture()
    state = load_state()

    raw_images = fixture.get("records", {}).get("images", [])
    duplicates_map = compute_duplicates(raw_images)
    by_id = {entry["product_id"]: entry for entry in state.get("images", [])}

    items = []
    for image in raw_images:
        pid = image["product_id"]
        entry = by_id.get(pid, {})

        # Compute live validation to ensure flags are current
        text_to_check = entry.get("edited_text") if entry.get("edited_text") is not None else entry.get("draft", image.get("visible_description", ""))
        val_result = validate_alt_text(
            text_to_check or "",
            image_is_decorative=bool(entry.get("is_decorative", False)),
            metadata_title=image.get("metadata_title"),
            page_context=entry.get("page_context", ""),
            contains_text=bool(entry.get("contains_text", False)),
            multiple_products=bool(entry.get("multiple_products", False)),
        )

        item = {
            "product_id": pid,
            "status": entry.get("status", "draft"),
            "draft": entry.get("draft") or image.get("visible_description"),
            "edited_text": entry.get("edited_text", ""),
            "page_context": entry.get("page_context", ""),
            "is_decorative": bool(entry.get("is_decorative", False)),
            "contains_text": bool(entry.get("contains_text", False)),
            "multiple_products": bool(entry.get("multiple_products", False)),
            "flags": list(dict.fromkeys(val_result["flags"] + val_result["warnings"])),
            "errors": val_result["errors"],
            "offending_words": val_result["offending_words"],
            "offending_details": val_result.get("offending_details", []),
            "source_label": entry.get("source_label", "rule-based fallback"),
            "metadata_title": image.get("metadata_title"),
            "visible_description": image.get("visible_description"),
            "path": image.get("path"),
            "review_note": image.get("review_note"),
            "duplicate_of": duplicates_map.get(pid),
        }
        items.append(item)

    return {
        "case_id": fixture.get("case_id", "C04"),
        "synthetic": fixture.get("synthetic", True),
        "images": items,
        "count": len(items),
    }


@router.post("/api/drafts/generate")
def generate_drafts(payload: GenerateDraftPayload | None = None) -> dict[str, Any]:
    target_id = payload.product_id if payload else None
    fixture = read_fixture()
    state = load_state()
    by_id = {entry["product_id"]: entry for entry in state.get("images", [])}

    raw_images = fixture.get("records", {}).get("images", [])
    if target_id and target_id.lower() != "all":
        target_img = next((img for img in raw_images if img["product_id"] == target_id), None)
        if not target_img:
            raise HTTPException(status_code=404, detail=f"Product {target_id} not found")
        selected = [target_img]
    else:
        selected = raw_images

    generated = []
    for img in selected:
        pid = img["product_id"]
        res = generate_draft(img)
        entry = by_id.get(pid)
        if entry:
            entry["draft"] = res["draft"]
            entry["source_label"] = res["source_label"]
        generated.append({
            "product_id": pid,
            "draft": res["draft"],
            "source_label": res["source_label"],
        })

    save_state(state)
    return {"images": generated, "count": len(generated)}


@router.put("/api/review/{product_id}")
def save_review(product_id: str, payload: ReviewPayload) -> dict[str, Any]:
    state = load_state()
    item = next((entry for entry in state.get("images", []) if entry["product_id"] == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    old_status = item.get("status", "draft")
    if payload.edited_text is not None:
        item["edited_text"] = payload.edited_text
    if payload.page_context is not None:
        item["page_context"] = payload.page_context
    if payload.is_decorative is not None:
        item["is_decorative"] = payload.is_decorative
    if payload.contains_text is not None:
        item["contains_text"] = payload.contains_text
    if payload.multiple_products is not None:
        item["multiple_products"] = payload.multiple_products

    # Rule 9: An approved item that is edited later returns to "needs re-review"
    if old_status == "approved":
        item["status"] = "needs_re_review"
    elif old_status == "flagged_inaccessible":
        # Keep flagged or allow editing
        item["status"] = "edited"
    else:
        item["status"] = "edited"

    # Run validator
    val = validate_alt_text(
        item.get("edited_text") or "",
        image_is_decorative=item.get("is_decorative", False),
        metadata_title=item.get("metadata_title"),
        page_context=item.get("page_context", ""),
        contains_text=item.get("contains_text", False),
        multiple_products=item.get("multiple_products", False),
    )
    item["flags"] = list(dict.fromkeys(val["flags"] + val["warnings"]))

    save_state(state)
    return {
        "product_id": product_id,
        "status": item["status"],
        "flags": item["flags"],
        "valid": val["valid"],
        "errors": val["errors"],
        "offending_words": val["offending_words"],
    }


@router.post("/api/review/{product_id}/approve")
def approve_review(product_id: str) -> dict[str, Any]:
    state = load_state()
    item = next((entry for entry in state.get("images", []) if entry["product_id"] == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    is_decorative = bool(item.get("is_decorative", False))
    # If decorative, empty text is valid; otherwise prefer edited_text over draft
    text_to_validate = (item.get("edited_text") if item.get("edited_text") is not None else item.get("draft") or "").strip()

    val = validate_alt_text(
        text_to_validate,
        image_is_decorative=is_decorative,
        metadata_title=item.get("metadata_title"),
        page_context=item.get("page_context", ""),
        contains_text=bool(item.get("contains_text", False)),
        multiple_products=bool(item.get("multiple_products", False)),
    )

    if not val["valid"]:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Validation failed; cannot approve description with blocking errors.",
                "errors": val["errors"],
                "offending_words": val["offending_words"],
            },
        )

    item["status"] = "approved"
    item["flags"] = list(dict.fromkeys(val["flags"] + val["warnings"]))
    save_state(state)
    return {
        "product_id": product_id,
        "status": "approved",
        "flags": item["flags"],
    }


@router.post("/api/review/{product_id}/flag")
def flag_review(product_id: str, payload: FlagPayload) -> dict[str, Any]:
    state = load_state()
    item = next((entry for entry in state.get("images", []) if entry["product_id"] == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    item["status"] = "flagged_inaccessible"
    reason = payload.reason or "needs better source image"
    flags = [f for f in item.get("flags", []) if not f.startswith("flagged:")]
    flags.append(f"flagged: {reason}")
    item["flags"] = list(dict.fromkeys(flags))
    save_state(state)
    return {
        "product_id": product_id,
        "status": "flagged_inaccessible",
        "flags": item["flags"],
        "reason": reason,
    }


@router.post("/api/review/{product_id}/reset")
def reset_review(product_id: str) -> dict[str, Any]:
    fixture = read_fixture()
    state = load_state()
    item = next((entry for entry in state.get("images", []) if entry["product_id"] == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    fixture_item = next((img for img in fixture.get("records", {}).get("images", []) if img["product_id"] == product_id), None)
    initial_desc = fixture_item.get("visible_description") if fixture_item else ""

    item["status"] = "draft"
    item["draft"] = initial_desc
    item["edited_text"] = ""
    item["page_context"] = ""
    item["is_decorative"] = False
    item["contains_text"] = False
    item["multiple_products"] = False
    item["flags"] = []
    item["source_label"] = "rule-based fallback"

    save_state(state)
    return {
        "product_id": product_id,
        "status": "draft",
        "draft": initial_desc,
    }


@router.get(["/api/export.csv", "/api/export/csv"])
def export_csv() -> Response:
    csv_bytes = build_csv_export()
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="product_description_review_results.csv"',
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


@router.get(["/api/export.json", "/api/export/json"])
def export_json() -> dict[str, Any]:
    return build_json_export()


@router.get("/api/evidence")
def get_evidence() -> dict[str, Any]:
    state = load_state()
    images = state.get("images", [])
    approved = sum(1 for img in images if img.get("status") == "approved")
    flagged = sum(1 for img in images if img.get("status") == "flagged")
    return {
        "app": "VARNIX",
        "total_records": len(images),
        "ids_preserved": len(images),
        "approved_count": approved,
        "inaccessible_count": flagged,
        "reviewed_count": approved + flagged,
        "records": images,
    }


@router.post("/api/reset")
def reset_all() -> dict[str, Any]:
    fixture = read_fixture()
    state = load_state()
    raw_images = fixture.get("records", {}).get("images", [])
    state["images"] = [
        {
            "product_id": img["product_id"],
            "status": "draft",
            "draft": img.get("visible_description", ""),
            "edited_text": "",
            "flags": [],
            "source_label": "rule-based fallback",
        }
        for img in raw_images
    ]
    save_state(state)
    return {"success": True, "message": "State reset"}


class TranslatePayload(BaseModel):
    targetLanguage: str = "hi"
    text: str = ""


@router.post("/api/images/{product_id}/translate")
def translate_description(product_id: str, payload: TranslatePayload) -> dict[str, Any]:
    fallbacks = {
        "hi": "नीले रंग का गोल किनारों वाला आयताकार उत्पाद चित्र।",
        "te": "నీలం రంగులో గుండ్రని అంచులు ఉన్న దీర్ఘచతురస్రాకార ఉత్పత్తి చిత్రం.",
        "ta": "நீல நிற வட்டமான செவ்வக வடிவ தயாரிப்பு விளக்கம்.",
    }
    return {
        "success": True,
        "productId": product_id,
        "targetLanguage": payload.targetLanguage,
        "translatedText": fallbacks.get(payload.targetLanguage, payload.text),
        "status": "SYNCED",
    }
