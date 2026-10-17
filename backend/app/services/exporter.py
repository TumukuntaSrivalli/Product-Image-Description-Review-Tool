import csv
import io
from typing import Any

from .store import load_state, read_fixture

CSV_FIELDNAMES = [
    "product_id",
    "final_description",
    "status",
    "edited_by_human",
    "flags",
    "source_label",
]


def sanitize_csv_cell(value: Any) -> str:
    """
    Prevents formula injection in spreadsheets (Excel/Google Sheets/Calc).
    Prefix cells starting with =, +, -, @ with an apostrophe.
    """
    text = str(value if value is not None else "")
    if text.startswith(("=", "+", "-", "@")):
        return "'" + text
    return text


def generate_export_records() -> list[dict[str, Any]]:
    fixture = read_fixture()
    state = load_state()
    by_id = {entry["product_id"]: entry for entry in state.get("images", [])}

    records: list[dict[str, Any]] = []
    for image in fixture.get("records", {}).get("images", []):
        pid = image["product_id"]
        entry = by_id.get(pid, {})
        status = entry.get("status", "draft")
        edited_text = entry.get("edited_text", "")
        draft_text = entry.get("draft") or image.get("visible_description") or ""
        is_decorative = entry.get("is_decorative", False)

        if is_decorative:
            final_text = ""
        else:
            final_text = edited_text.strip() if edited_text.strip() else draft_text.strip()

        edited_by_human = bool(edited_text.strip()) or is_decorative
        flags_list = entry.get("flags", [])
        flags_str = "; ".join(str(f) for f in flags_list) if isinstance(flags_list, list) else str(flags_list)
        source_label = entry.get("source_label", "rule-based fallback")

        records.append(
            {
                "product_id": pid,
                "final_description": final_text,
                "status": status,
                "edited_by_human": "true" if edited_by_human else "false",
                "flags": flags_str,
                "source_label": source_label,
            }
        )
    return records


def build_csv_export() -> bytes:
    records = generate_export_records()
    output = io.StringIO(newline="")
    writer = csv.DictWriter(output, fieldnames=CSV_FIELDNAMES, quoting=csv.QUOTE_ALL)
    writer.writeheader()

    for rec in records:
        writer.writerow({k: sanitize_csv_cell(rec.get(k, "")) for k in CSV_FIELDNAMES})

    # Prepend UTF-8 BOM
    return output.getvalue().encode("utf-8-sig")


def build_json_export() -> dict[str, Any]:
    state = load_state()
    records = generate_export_records()
    return {
        "case_id": "C04",
        "total_records": len(records),
        "exported_records": records,
        "images": state.get("images", []),
    }
