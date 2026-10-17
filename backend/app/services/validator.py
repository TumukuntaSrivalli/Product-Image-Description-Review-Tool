import re
from typing import Any

UNSUPPORTED_WORDS = {
    "cotton": "material",
    "leather": "material",
    "ceramic": "material",
    "steel": "material",
    "silicone": "material",
    "iso": "certification",
    "bis": "certification",
    "ce": "certification",
    "certified": "certification",
    "organic": "certification",
    "waterproof": "performance",
    "durable": "performance",
    "fast": "performance",
    "ergonomic": "performance",
    "long-lasting": "performance",
    "lasting": "performance",
    "brand": "identity",
    "logo": "identity",
    "premium": "superlative",
    "best": "superlative",
    "top": "superlative",
    "ultimate": "superlative",
    "perfect": "superlative",
    "excellent": "superlative",
}

COLOUR_WORDS = {
    "red": "red",
    "blue": "blue",
    "black": "black",
    "grey": "grey",
    "gray": "grey",
    "green": "green",
    "white": "white",
    "yellow": "yellow",
    "orange": "orange",
    "purple": "purple",
    "brown": "brown",
    "pink": "pink",
}


def _tokenize_words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z-]+", (text or "").lower())


def validate_alt_text(text: str, *, image_is_decorative: bool = False, metadata_title: str | None = None, page_context: str | None = None, contains_text: bool = False, multiple_products: bool = False) -> dict[str, Any]:
    cleaned = (text or "").strip()
    warnings: list[str] = []
    errors: list[str] = []
    flags: list[str] = []

    if not cleaned:
        if image_is_decorative:
            return {"valid": True, "warnings": warnings, "errors": errors, "flags": flags, "offending_words": []}
        errors.append("empty text")
        return {"valid": False, "warnings": warnings, "errors": errors, "flags": flags, "offending_words": []}

    if re.match(r"^(image of|picture of|photo of)\b", cleaned, flags=re.IGNORECASE):
        errors.append("starts with forbidden introductory phrase")

    if len(cleaned) > 125:
        warnings.append("length warning")
    if len(cleaned) > 250:
        errors.append("too long")

    offending_words: list[str] = []
    words = _tokenize_words(cleaned)
    for w in words:
        if w in UNSUPPORTED_WORDS:
            offending_words.append(w)
    if offending_words:
        errors.append("unsupported claim")

    if page_context and page_context.strip():
        context_text = page_context.lower()
        description_text = cleaned.lower()
        if context_text and description_text and context_text in description_text:
            warnings.append("avoid repeating adjacent text")

    colour_hits = [w for w in words if w in COLOUR_WORDS]
    if colour_hits and metadata_title:
        title_words = _tokenize_words(metadata_title)
        title_colour = [w for w in title_words if w in COLOUR_WORDS]
        if title_colour and colour_hits and title_colour[0] != colour_hits[0]:
            flags.append("colour uncertain")
    elif colour_hits:
        if len(set(colour_hits)) > 1:
            flags.append("colour uncertain")

    if contains_text and not re.search(r"\b(text|word|label|writing|headline|script)\b", cleaned, flags=re.IGNORECASE):
        errors.append("contains text requires transcription")

    if multiple_products and re.search(r"\b(one|single|item|product)\b", cleaned, flags=re.IGNORECASE):
        warnings.append("multiple products should describe group")

    if metadata_title and page_context:
        if re.search(r"\b(appears|seems|likely)\b", cleaned, flags=re.IGNORECASE):
            flags.append("colour uncertain")

    return {
        "valid": not errors,
        "warnings": warnings,
        "errors": errors,
        "flags": flags,
        "offending_words": sorted(set(offending_words)),
    }
