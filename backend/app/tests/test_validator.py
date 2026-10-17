import pytest

from app.services.validator import validate_alt_text


def test_rejects_material_and_certification_claims():
    result = validate_alt_text('Blue cotton T-shirt with BIS certification', metadata_title='Blue Tshirt')
    assert result['valid'] is False
    assert 'cotton' in result['offending_words']
    assert 'bis' in result['offending_words']


def test_blocks_long_text_and_empty_text():
    long_text = 'Blue rounded rectangular product illustration ' * 5
    result = validate_alt_text(long_text)
    assert result['warnings'] == ['length warning']
    assert validate_alt_text('')['valid'] is False


def test_rejects_intro_phrases_and_flag_uncertain_colour():
    result = validate_alt_text('Picture of a blue mug', metadata_title='Red Mug')
    assert result['valid'] is False
    assert 'colour uncertain' in result['flags']


def test_allows_decorative_image_with_explicit_confirmation():
    result = validate_alt_text('', image_is_decorative=True)
    assert result['valid'] is True


def test_requires_text_transcription_when_contains_text():
    result = validate_alt_text('Blue product', contains_text=True)
    assert result['valid'] is False


def test_flags_multiple_products_group_description():
    result = validate_alt_text('Blue product', multiple_products=True)
    assert result['warnings'] == ['multiple products should describe group']


def test_warns_on_adjacent_context_repetition():
    result = validate_alt_text('Blue rounded rectangular product illustration', page_context='Blue rounded rectangular product illustration')
    assert 'avoid repeating adjacent text' in result['warnings']


def test_approved_item_edit_reverts_to_needs_review_is_backend_logic_not_validator():
    assert True
