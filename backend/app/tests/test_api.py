import json
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_images_endpoint_returns_all_ten_products():
    response = client.get('/api/images')
    assert response.status_code == 200
    data = response.json()
    assert len(data['images']) == 10
    assert {img['product_id'] for img in data['images']} == {f'P{i:02d}' for i in range(1, 11)}


def test_generate_draft_works():
    response = client.post('/api/drafts/generate', json={'product_id': 'P01'})
    assert response.status_code == 200
    assert response.json()['images'][0]['draft'] == 'Blue rounded rectangular product illustration'


def test_review_and_approve_flow():
    client.post('/api/review/P01/reset')
    payload = {'edited_text': 'Blue rounded rectangular product illustration', 'page_context': ''}
    response = client.put('/api/review/P01', json=payload)
    assert response.status_code == 200
    assert response.json()['status'] in {'edited', 'needs_re_review'}

    approve = client.post('/api/review/P01/approve')
    assert approve.status_code == 200
    assert approve.json()['status'] == 'approved'


def test_export_csv_has_all_ids_and_utf8_bom():
    response = client.get('/api/export.csv')
    assert response.status_code == 200
    content = response.content
    assert content.startswith(b'\xef\xbb\xbf')
    assert b'P01' in content and b'P10' in content


def test_state_persistence_roundtrip_uses_json_file():
    state_path = Path(__file__).resolve().parents[2] / 'data' / 'review_state.json'
    assert state_path.exists()
    data = json.loads(state_path.read_text(encoding='utf-8'))
    assert 'images' in data
