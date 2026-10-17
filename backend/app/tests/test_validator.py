import pytest
from app.services.validator import validate_alt_text


def test_rejects_material_and_certification_claims():
    result = validate_alt_text("Blue cotton T-shirt with BIS certification", metadata_title="Blue Tshirt")
    assert result["valid"] is False
    assert "cotton" in result["offending_words"]
    assert "bis" in result["offending_words"]
    assert any("unsupported claim" in err.lower() for err in result["errors"])


def test_rejects_performance_and_superlative_claims():
    result = validate_alt_text("Waterproof durable premium mouse", metadata_title="Black Mouse")
    assert result["valid"] is False
    assert "waterproof" in result["offending_words"]
    assert "durable" in result["offending_words"]
    assert "premium" in result["offending_words"]


def test_blocks_long_text_and_empty_text():
    # Between 125 and 250 characters -> warning
    medium_text = "Blue rounded rectangular product illustration with clear high contrast styling and detailed contours suitable for high visibility review."
    assert 125 < len(medium_text) <= 250
    res_medium = validate_alt_text(medium_text)
    assert any("125" in w for w in res_medium["warnings"])
    assert res_medium["valid"] is True

    # Over 250 characters -> hard block error
    long_text = "Blue rounded rectangular product illustration " * 7
    assert len(long_text) > 250
    res_long = validate_alt_text(long_text)
    assert any("250" in err for err in res_long["errors"])
    assert res_long["valid"] is False

    # Empty text -> blocked unless decorative
    assert validate_alt_text("")["valid"] is False
    assert validate_alt_text("   ")["valid"] is False


def test_rejects_intro_phrases_and_flag_uncertain_colour():
    # "picture of", "image of", "photo of"
    res1 = validate_alt_text("Picture of a blue mug", metadata_title="Red Mug")
    assert res1["valid"] is False
    assert any("forbidden introductory phrase" in err for err in res1["errors"])
    assert "colour uncertain" in res1["flags"]

    res2 = validate_alt_text("Image of red bottle", metadata_title="Red Bottle")
    assert res2["valid"] is False
    assert any("forbidden introductory phrase" in err for err in res2["errors"])

    res3 = validate_alt_text("Photo of green bottle", metadata_title="Green Bottle")
    assert res3["valid"] is False
    assert any("forbidden introductory phrase" in err for err in res3["errors"])


def test_allows_decorative_image_with_explicit_confirmation():
    result = validate_alt_text("", image_is_decorative=True)
    assert result["valid"] is True
    assert len(result["errors"]) == 0


def test_requires_text_transcription_when_contains_text():
    # When contains_text is true, requires transcription
    result_invalid = validate_alt_text("Blue bottle illustration", contains_text=True)
    assert result_invalid["valid"] is False
    assert any("transcription" in err for err in result_invalid["errors"])

    result_valid = validate_alt_text('Blue bottle with text "Pure Water"', contains_text=True)
    assert result_valid["valid"] is True


def test_flags_multiple_products_group_description():
    # Ticked multiple products without group description
    res1 = validate_alt_text("Single blue bottle", multiple_products=True)
    assert any("multiple products should describe group" in w for w in res1["warnings"])

    # Group description satisfies requirement
    res2 = validate_alt_text("Set of three blue bottles arranged in a row", multiple_products=True)
    assert not any("multiple products should describe group" in w for w in res2["warnings"])


def test_warns_on_adjacent_context_repetition():
    result = validate_alt_text(
        "Blue rounded rectangular product illustration",
        page_context="Blue rounded rectangular product illustration on sale now.",
    )
    assert any("avoid repeating adjacent text" in w for w in result["warnings"])


def test_uncertain_colour_phrases():
    result = validate_alt_text("Appears blue under ambient light")
    assert "colour uncertain" in result["flags"]
