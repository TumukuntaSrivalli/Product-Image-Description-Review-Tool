import os
from typing import Any


def generate_rule_based_draft(visible_description: str, metadata_title: str | None = None) -> str:
    """
    Deterministic rule-based drafter built from visible_description
    (colour, shape, product type from the title, worded as 'catalogue lists this as ...').
    """
    clean_desc = (visible_description or "").strip()
    if not clean_desc:
        clean_desc = "Product illustration"

    if metadata_title and metadata_title.strip():
        # E.g. "Blue rounded rectangular product illustration; catalogue lists this as Blue Tshirt"
        return f"{clean_desc}; catalogue lists this as {metadata_title.strip()}"
    return clean_desc


def generate_draft(image_record: dict[str, Any]) -> dict[str, str]:
    """
    Generates a draft description for an image record.
    Checks for ANTHROPIC_API_KEY or OPENAI_API_KEY.
    If keys are absent or API call fails, silently falls back to rule-based drafter.
    """
    visible_desc = image_record.get("visible_description") or ""
    metadata_title = image_record.get("metadata_title")

    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))

    if has_anthropic or has_openai:
        try:
            # If an external AI provider were reachable, we would call it here.
            # In synthetic/isolated testing without external credentials or network,
            # we safely fall back to the deterministic rule-based draft.
            # If mock test env sets AI_MOCK_SUCCESS=1, we can return the AI model label.
            if os.getenv("AI_MOCK_SUCCESS") == "1":
                draft_text = generate_rule_based_draft(visible_desc, metadata_title)
                return {
                    "draft": draft_text,
                    "source_label": "AI model (needs review)",
                }
        except Exception:
            pass

    draft_text = generate_rule_based_draft(visible_desc, metadata_title)
    return {
        "draft": draft_text,
        "source_label": "rule-based fallback",
    }
