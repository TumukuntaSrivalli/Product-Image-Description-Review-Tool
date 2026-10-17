import re
from typing import Any

UNSUPPORTED_WORDS = {
    # Materials (cannot prove from synthetic illustration)
    "cotton": "material",
    "leather": "material",
    "ceramic": "material",
    "steel": "material",
    "silicone": "material",
    "wood": "material",
    "plastic": "material",
    "metal": "material",
    "glass": "material",
    "wool": "material",
    "polyester": "material",
    "nylon": "material",
    "linen": "material",
    "silk": "material",
    "denim": "material",
    "canvas": "material",
    "aluminum": "material",
    "titanium": "material",
    # Certifications
    "iso": "certification",
    "bis": "certification",
    "ce": "certification",
    "certified": "certification",
    "certification": "certification",
    "organic": "certification",
    "fda": "certification",
    "rohs": "certification",
    "gots": "certification",
    # Performance claims
    "waterproof": "performance",
    "durable": "performance",
    "durability": "performance",
    "fast": "performance",
    "ergonomic": "performance",
    "long-lasting": "performance",
    "lasting": "performance",
    "breathable": "performance",
    "shockproof": "performance",
    "indestructible": "performance",
    "rust-proof": "performance",
    "scratch-resistant": "performance",
    "heavy-duty": "performance",
    # Identity / brand / people claims
    "brand": "identity",
    "logo": "identity",
    "official": "identity",
    "authentic": "identity",
    "genuine": "identity",
    "nike": "identity",
    "apple": "identity",
    "person": "identity",
    "man": "identity",
    "woman": "identity",
    "designer": "identity",
    # Superlatives
    "premium": "superlative",
    "best": "superlative",
    "top": "superlative",
    "ultimate": "superlative",
    "perfect": "superlative",
    "excellent": "superlative",
    "finest": "superlative",
    "greatest": "superlative",
    "superior": "superlative",
    "unmatched": "superlative",
    "flawless": "superlative",
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
    return re.findall(r"[A-Za-z0-9-]+", (text or "").lower())


def validate_alt_text(
    text: str,
    *,
    image_is_decorative: bool = False,
    metadata_title: str | None = None,
    page_context: str | None = None,
    contains_text: bool = False,
    multiple_products: bool = False,
) -> dict[str, Any]:
    """
    Pure validation function enforcing accessibility and catalogue integrity:
    1. Blocks unsupported claims (material, certification, performance, identity, superlatives).
    2. Enforces length constraints (warning > 125, hard error > 250, empty blocked unless decorative).
    3. Blocks 'image of / picture of / photo of' starter phrases.
    4. Detects ambiguous/uncertain colour cues.
    5. Allows decorative image confirmation (alt="").
    6. Requires transcription if image contains text.
    7. Requires group description if multiple products are ticked.
    8. Warns against repeating adjacent page context copy.
    """
    cleaned = (text or "").strip()
    warnings: list[str] = []
    errors: list[str] = []
    flags: list[str] = []
    offending_words: list[str] = []
    offending_details: list[dict[str, str]] = []

    # Rule 2 & 5: Empty text vs decorative
    if not cleaned:
        if image_is_decorative:
            return {
                "valid": True,
                "warnings": warnings,
                "errors": errors,
                "flags": flags,
                "offending_words": [],
                "offending_details": [],
            }
        errors.append("empty text")
        return {
            "valid": False,
            "warnings": warnings,
            "errors": errors,
            "flags": flags,
            "offending_words": [],
            "offending_details": [],
        }

    # Rule 3: Do not start with "image of / picture of / photo of"
    if re.match(r"^(image of|picture of|photo of|graphic of|icon of)\b", cleaned, flags=re.IGNORECASE):
        errors.append("starts with forbidden introductory phrase ('image of / picture of / photo of')")

    # Rule 2: Length checks
    if len(cleaned) > 125:
        warnings.append("Length exceeds 125 characters (recommended concise limit)")
    if len(cleaned) > 250:
        errors.append("Length exceeds hard maximum of 250 characters")

    # Rule 1: Unsupported claims
    tokens = _tokenize_words(cleaned)
    for word in tokens:
        category = UNSUPPORTED_WORDS.get(word)
        if category:
            offending_words.append(word)
            offending_details.append(
                {
                    "word": word,
                    "category": category,
                    "reason": f"Unsupported {category} claim not verifiable from illustration",
                }
            )

    if offending_words:
        unique_offenders = sorted(set(offending_words))
        errors.append(f"Contains unsupported claim(s): {', '.join(unique_offenders)}")

    # Rule 8: Essential info already adjacent
    if page_context and page_context.strip():
        context_clean = page_context.strip().lower()
        desc_clean = cleaned.lower()
        # If the description is repeated in context or context is in description
        if (len(desc_clean) > 8 and desc_clean in context_clean) or (len(context_clean) > 8 and context_clean in desc_clean):
            warnings.append("avoid repeating adjacent text: suggest a shorter description since context already provides this")
        elif any(part.strip() in desc_clean for part in context_clean.split(".") if len(part.strip()) > 15):
            warnings.append("avoid repeating adjacent text: description overlaps with adjacent page context")

    # Rule 4: Ambiguous colour
    desc_colours = [COLOUR_WORDS[w] for w in tokens if w in COLOUR_WORDS]
    if desc_colours and metadata_title:
        title_tokens = _tokenize_words(metadata_title)
        title_colours = [COLOUR_WORDS[w] for w in title_tokens if w in COLOUR_WORDS]
        if title_colours and desc_colours and title_colours[0] != desc_colours[0]:
            flags.append("colour uncertain")
    elif len(set(desc_colours)) > 1:
        flags.append("colour uncertain")

    if re.search(r"\b(appears|seems|uncertain|likely|apparent)\b", cleaned, flags=re.IGNORECASE):
        if "colour uncertain" not in flags:
            flags.append("colour uncertain")

    # Rule 6: Text in image requires transcription
    if contains_text:
        # Check if text mentions words like "text", "reads", "lettering", "label", quotes, or specific transcriptions
        has_transcription = bool(re.search(r"(\"[^\"]+\"|'[^']+'|\b(text|word|words|reads|labeled|labelled|lettering|inscribed|writing)\b)", cleaned, flags=re.IGNORECASE))
        if not has_transcription:
            errors.append("contains text requires transcription of the visible text")

    # Rule 7: Multiple products requires describing group
    if multiple_products:
        mentions_single = bool(re.search(r"\b(single|one item|sole)\b", cleaned, flags=re.IGNORECASE))
        describes_group = bool(re.search(r"\b(set|group|collection|pair|multiple|items|trio|pack|assortment|bundle)\b", cleaned, flags=re.IGNORECASE))
        if mentions_single or not describes_group:
            warnings.append("multiple products should describe group, not just a single item")

    # Deduplicate flags and warnings
    flags = list(dict.fromkeys(flags))
    warnings = list(dict.fromkeys(warnings))
    errors = list(dict.fromkeys(errors))

    return {
        "valid": len(errors) == 0,
        "warnings": warnings,
        "errors": errors,
        "flags": flags,
        "offending_words": sorted(set(offending_words)),
        "offending_details": offending_details,
    }
