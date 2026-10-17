import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
FIXTURE_PATH = DATA_DIR / "fixture.json"
STATE_PATH = DATA_DIR / "review_state.json"
REFERENCE_GUIDE_PATH = DATA_DIR / "reference_guide.json"


def read_fixture() -> dict[str, Any]:
    if not FIXTURE_PATH.exists():
        raise FileNotFoundError(f"Fixture file not found at {FIXTURE_PATH}")
    return json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))


def read_reference_guide() -> dict[str, Any]:
    if not REFERENCE_GUIDE_PATH.exists():
        return {"acceptable_variations": []}
    return json.loads(REFERENCE_GUIDE_PATH.read_text(encoding="utf-8"))


def get_default_state() -> dict[str, Any]:
    fixture = read_fixture()
    images = []
    for item in fixture.get("records", {}).get("images", []):
        images.append(
            {
                "product_id": item["product_id"],
                "status": "draft",
                "draft": item["visible_description"],
                "edited_text": "",
                "page_context": "",
                "is_decorative": False,
                "contains_text": False,
                "multiple_products": False,
                "flags": [],
                "source_label": "rule-based fallback",
                "metadata_title": item.get("metadata_title"),
                "visible_description": item.get("visible_description"),
                "file_path": item.get("path"),
                "review_note": item.get("review_note"),
                "duplicate_of": None,
            }
        )
    return {"images": images}


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        state = get_default_state()
        save_state(state)
        return state

    try:
        raw = STATE_PATH.read_text(encoding="utf-8")
        state = json.loads(raw)
    except (json.JSONDecodeError, OSError):
        state = get_default_state()

    if not isinstance(state, dict) or "images" not in state or not state["images"]:
        state = get_default_state()
        save_state(state)

    # Ensure all 10 product IDs from fixture are present
    fixture = read_fixture()
    existing_by_id = {item["product_id"]: item for item in state.get("images", []) if isinstance(item, dict) and "product_id" in item}
    synced_images = []
    for item in fixture.get("records", {}).get("images", []):
        pid = item["product_id"]
        if pid in existing_by_id:
            curr = existing_by_id[pid]
            curr["metadata_title"] = item.get("metadata_title")
            curr["visible_description"] = item.get("visible_description")
            curr["file_path"] = item.get("path")
            curr["review_note"] = item.get("review_note")
            synced_images.append(curr)
        else:
            synced_images.append(
                {
                    "product_id": pid,
                    "status": "draft",
                    "draft": item["visible_description"],
                    "edited_text": "",
                    "page_context": "",
                    "is_decorative": False,
                    "contains_text": False,
                    "multiple_products": False,
                    "flags": [],
                    "source_label": "rule-based fallback",
                    "metadata_title": item.get("metadata_title"),
                    "visible_description": item.get("visible_description"),
                    "file_path": item.get("path"),
                    "review_note": item.get("review_note"),
                    "duplicate_of": None,
                }
            )

    state["images"] = synced_images
    return state


def save_state(state: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp_path = STATE_PATH.with_suffix(".tmp")
    tmp_path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp_path.replace(STATE_PATH)
