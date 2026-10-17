import csv
import io
import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Response

from ..services.validator import validate_alt_text

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FIXTURE_PATH = BASE_DIR / 'data' / 'fixture.json'
STATE_PATH = BASE_DIR / 'data' / 'review_state.json'
REFERENCE_GUIDE_PATH = BASE_DIR / 'data' / 'reference_guide.json'

router = APIRouter()


def _read_fixture() -> dict[str, Any]:
    return json.loads(FIXTURE_PATH.read_text(encoding='utf-8'))


def _default_state() -> dict[str, Any]:
    fixture = _read_fixture()
    return {
        'images': [
            {
                'product_id': item['product_id'],
                'status': 'draft',
                'draft': item['visible_description'],
                'edited_text': '',
                'page_context': '',
                'is_decorative': False,
                'contains_text': False,
                'multiple_products': False,
                'flags': [],
                'source_label': 'rule-based fallback',
                'metadata_title': item.get('metadata_title'),
                'visible_description': item.get('visible_description'),
                'file_path': item.get('path'),
                'review_note': item.get('review_note'),
                'duplicate_of': None,
            }
            for item in fixture['records']['images']
        ]
    }


def _load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        state = _default_state()
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding='utf-8')
        return state
    try:
        state = json.loads(STATE_PATH.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        state = _default_state()
    if 'images' not in state or not state['images']:
        state = _default_state()
    return state


def _atomic_write_json(data: dict[str, Any]) -> None:
    tmp = STATE_PATH.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp.replace(STATE_PATH)


@router.get('/api/images')
def list_images() -> dict[str, Any]:
    fixture = _read_fixture()
    state = _load_state()
    by_id = {entry['product_id']: entry for entry in state['images']}
    items = []
    seen: dict[str, str] = {}
    for image in fixture['records']['images']:
        product_id = image['product_id']
        entry = by_id.get(product_id, {
            'product_id': product_id,
            'status': 'draft',
            'draft': image['visible_description'],
            'edited_text': '',
            'page_context': '',
            'is_decorative': False,
            'contains_text': False,
            'multiple_products': False,
            'flags': [],
            'source_label': 'rule-based fallback',
            'metadata_title': image.get('metadata_title'),
            'visible_description': image.get('visible_description'),
            'file_path': image.get('path'),
            'review_note': image.get('review_note'),
            'duplicate_of': None,
        })
        duplicate = None
        for other in fixture['records']['images']:
            if other['product_id'] != product_id and other['visible_description'] == image['visible_description']:
                duplicate = other['product_id']
                break
        entry['duplicate_of'] = duplicate
        entry['path'] = image.get('path')
        if 'visible_description' not in entry:
            entry['visible_description'] = image.get('visible_description')
        if 'status' not in entry:
            entry['status'] = 'draft'
        if 'draft' not in entry:
            entry['draft'] = image['visible_description']
        if 'flags' not in entry:
            entry['flags'] = []
        if 'source_label' not in entry:
            entry['source_label'] = 'rule-based fallback'
        items.append(entry)
    return {'images': items, 'case_id': fixture.get('case_id')}


@router.post('/api/drafts/generate')
def generate_draft(payload: dict[str, str | None]) -> dict[str, Any]:
    product_id = payload.get('product_id')
    fixture = _read_fixture()
    results = []
    for image in fixture['records']['images']:
        if product_id is not None and image['product_id'] != product_id:
            continue
        draft = image['visible_description']
        source = 'rule-based fallback'
        results.append({'product_id': image['product_id'], 'draft': draft, 'source_label': source})
    if product_id is not None and len(results) == 0:
        raise HTTPException(status_code=404, detail='Product not found')
    return {'images': results, 'count': len(results)}


@router.put('/api/review/{product_id}')
def save_review(product_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    state = _load_state()
    item = next((entry for entry in state['images'] if entry['product_id'] == product_id), None)
    if item is None:
        fixture = _read_fixture()
        image = next((img for img in fixture['records']['images'] if img['product_id'] == product_id), None)
        if image is None:
            raise HTTPException(status_code=404, detail='Product not found')
        item = {
            'product_id': product_id,
            'status': 'draft',
            'draft': image['visible_description'],
            'edited_text': '',
            'page_context': '',
            'is_decorative': False,
            'contains_text': False,
            'multiple_products': False,
            'flags': [],
            'source_label': 'rule-based fallback',
            'metadata_title': image.get('metadata_title'),
            'visible_description': image.get('visible_description'),
            'file_path': image.get('path'),
            'review_note': image.get('review_note'),
            'duplicate_of': None,
        }
        state['images'].append(item)
    item['edited_text'] = payload.get('edited_text', item.get('edited_text', ''))
    item['page_context'] = payload.get('page_context', item.get('page_context', ''))
    item['is_decorative'] = bool(payload.get('is_decorative', item.get('is_decorative', False)))
    item['contains_text'] = bool(payload.get('contains_text', item.get('contains_text', False)))
    item['multiple_products'] = bool(payload.get('multiple_products', item.get('multiple_products', False)))
    item['status'] = 'edited' if item.get('status') != 'approved' else 'needs_re_review'
    result = validate_alt_text(item['edited_text'] or '', image_is_decorative=item['is_decorative'], metadata_title=item['metadata_title'], page_context=item['page_context'], contains_text=item['contains_text'], multiple_products=item['multiple_products'])
    item['flags'] = result['flags'] + result['warnings']
    _atomic_write_json(state)
    return {'product_id': product_id, 'status': item['status'], 'flags': item['flags']}


@router.post('/api/review/{product_id}/approve')
def approve_review(product_id: str) -> dict[str, Any]:
    state = _load_state()
    item = next((entry for entry in state['images'] if entry['product_id'] == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail='Product not found')
    text = (item.get('edited_text') or item.get('draft') or '').strip()
    result = validate_alt_text(text, image_is_decorative=item.get('is_decorative', False), metadata_title=item.get('metadata_title'), page_context=item.get('page_context', ''), contains_text=item.get('contains_text', False), multiple_products=item.get('multiple_products', False))
    if not result['valid']:
        raise HTTPException(status_code=400, detail={'message': 'Validation failed', 'errors': result['errors']})
    item['status'] = 'approved'
    item['flags'] = result['flags'] + result['warnings']
    _atomic_write_json(state)
    return {'product_id': product_id, 'status': 'approved'}


@router.post('/api/review/{product_id}/flag')
def flag_review(product_id: str, payload: dict[str, str]) -> dict[str, Any]:
    state = _load_state()
    item = next((entry for entry in state['images'] if entry['product_id'] == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail='Product not found')
    item['status'] = 'flagged_inaccessible'
    item['flags'] = ['inaccessible image', payload.get('reason', 'needs better source image')]
    _atomic_write_json(state)
    return {'product_id': product_id, 'status': 'flagged_inaccessible'}


@router.post('/api/review/{product_id}/reset')
def reset_review(product_id: str) -> dict[str, Any]:
    state = _load_state()
    item = next((entry for entry in state['images'] if entry['product_id'] == product_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail='Product not found')
    fixture = _read_fixture()
    image = next((img for img in fixture['records']['images'] if img['product_id'] == product_id), None)
    item['status'] = 'draft'
    item['draft'] = image['visible_description']
    item['edited_text'] = ''
    item['page_context'] = ''
    item['is_decorative'] = False
    item['contains_text'] = False
    item['multiple_products'] = False
    item['flags'] = []
    item['source_label'] = 'rule-based fallback'
    _atomic_write_json(state)
    return {'product_id': product_id, 'status': 'draft'}


@router.get('/api/export.csv')
def export_csv() -> Response:
    fixture = _read_fixture()
    state = _load_state()
    fieldnames = ['product_id', 'final_description', 'status', 'edited_by_human', 'flags', 'source_label']
    rows = []
    by_id = {entry['product_id']: entry for entry in state['images']}
    for image in fixture['records']['images']:
        product_id = image['product_id']
        entry = by_id.get(product_id, {'product_id': product_id, 'status': 'draft', 'edited_text': '', 'flags': [], 'source_label': 'rule-based fallback'})
        final_text = (entry.get('edited_text') or entry.get('draft') or '').strip()
        status = entry.get('status', 'draft')
        flags = ', '.join(str(x) for x in entry.get('flags', []))
        rows.append({
            'product_id': product_id,
            'final_description': final_text,
            'status': status,
            'edited_by_human': 'true' if entry.get('edited_text', '').strip() else 'false',
            'flags': flags,
            'source_label': entry.get('source_label', 'rule-based fallback'),
        })
    out = io.StringIO(newline='')
    writer = csv.DictWriter(out, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    for row in rows:
        writer.writerow({
            'product_id': _sanitize_csv_cell(row['product_id']),
            'final_description': _sanitize_csv_cell(row['final_description']),
            'status': _sanitize_csv_cell(row['status']),
            'edited_by_human': _sanitize_csv_cell(row['edited_by_human']),
            'flags': _sanitize_csv_cell(row['flags']),
            'source_label': _sanitize_csv_cell(row['source_label']),
        })
    text = out.getvalue().encode('utf-8-sig').decode('utf-8')
    return Response(content=text, media_type='text/csv; charset=utf-8-sig', headers={'Content-Disposition': 'attachment; filename="altlume-export.csv"'})


def _sanitize_csv_cell(value: str) -> str:
    value = str(value or '')
    if value.startswith(('=', '-', '@')):
        return "'" + value
    return value


@router.get('/api/export.json')
def export_json() -> dict[str, Any]:
    state = _load_state()
    return {'images': state.get('images', [])}
