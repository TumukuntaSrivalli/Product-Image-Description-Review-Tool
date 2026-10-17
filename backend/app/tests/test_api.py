import csv
import io
import json
from pathlib import Path
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_images_endpoint_returns_all_ten_products_with_duplicates():
    response = client.get("/api/images")
    assert response.status_code == 200
    data = response.json()
    assert len(data["images"]) == 10
    product_ids = [img["product_id"] for img in data["images"]]
    assert product_ids == [f"P{i:02d}" for i in range(1, 11)]

    # Check identical visible description flags (P01, P02, P04)
    p01 = next(img for img in data["images"] if img["product_id"] == "P01")
    p02 = next(img for img in data["images"] if img["product_id"] == "P02")
    p04 = next(img for img in data["images"] if img["product_id"] == "P04")

    assert p01["duplicate_of"] is None
    assert p02["duplicate_of"] == "P01"
    assert p04["duplicate_of"] == "P01"


def test_generate_draft_single_and_all():
    # Single product
    resp_single = client.post("/api/drafts/generate", json={"product_id": "P01"})
    assert resp_single.status_code == 200
    single_data = resp_single.json()
    assert len(single_data["images"]) == 1
    assert "Blue" in single_data["images"][0]["draft"]
    assert single_data["images"][0]["source_label"] == "rule-based fallback"

    # All products
    resp_all = client.post("/api/drafts/generate", json={"product_id": "all"})
    assert resp_all.status_code == 200
    all_data = resp_all.json()
    assert len(all_data["images"]) == 10


def test_review_validation_and_approval_flow():
    # Reset P03
    client.post("/api/review/P03/reset")

    # Try approving with unsupported claim -> Should be blocked with 400
    client.put("/api/review/P03", json={"edited_text": "Red cotton shirt with durable finish"})
    bad_approve = client.post("/api/review/P03/approve")
    assert bad_approve.status_code == 400
    assert "errors" in bad_approve.json()["detail"]

    # Provide valid alt text and approve
    valid_text = "Red rounded rectangular product illustration with matte finish"
    put_resp = client.put("/api/review/P03", json={"edited_text": valid_text, "page_context": "Summer catalogue"})
    assert put_resp.status_code == 200
    assert put_resp.json()["status"] == "edited"

    good_approve = client.post("/api/review/P03/approve")
    assert good_approve.status_code == 200
    assert good_approve.json()["status"] == "approved"

    # Rule 9: An approved item that is edited later returns to "needs re-review"
    edit_again = client.put("/api/review/P03", json={"edited_text": "Red rounded rectangular illustration update"})
    assert edit_again.status_code == 200
    assert edit_again.json()["status"] == "needs_re_review"


def test_flag_inaccessible_and_reset():
    # Flag P05 as inaccessible
    flag_resp = client.post("/api/review/P05/flag", json={"reason": "low contrast resolution"})
    assert flag_resp.status_code == 200
    assert flag_resp.json()["status"] == "flagged_inaccessible"

    # Verify state shows flagged
    images_resp = client.get("/api/images")
    p05 = next(img for img in images_resp.json()["images"] if img["product_id"] == "P05")
    assert p05["status"] == "flagged_inaccessible"

    # Reset P05
    reset_resp = client.post("/api/review/P05/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "draft"


def test_decorative_image_approval():
    # Decorative allows empty alt text
    client.post("/api/review/P06/reset")
    client.put("/api/review/P06", json={"edited_text": "", "is_decorative": True})
    approve_resp = client.post("/api/review/P06/approve")
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"


def test_csv_export_roundtrip_and_security():
    # Put custom text on P01 that tests formula injection protection
    formula_test_text = "=SUM(1,2) formula test description"
    client.put("/api/review/P01", json={"edited_text": formula_test_text})

    response = client.get("/api/export.csv")
    assert response.status_code == 200
    content = response.content

    # 1. UTF-8 BOM
    assert content.startswith(b"\xef\xbb\xbf")

    # 2. Parse CSV
    decoded = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))
    rows = list(reader)

    # 3. All 10 product IDs must always be present
    assert len(rows) == 10
    exported_ids = [r["product_id"] for r in rows]
    assert exported_ids == [f"P{i:02d}" for i in range(1, 11)]

    # 4. Formula injection safe: cells starting with = + - @ must start with '
    p01_row = next(r for r in rows if r["product_id"] == "P01")
    assert p01_row["final_description"].startswith("'=")


def test_state_persistence_across_reloads():
    state_path = Path(__file__).resolve().parents[2] / "data" / "review_state.json"
    assert state_path.exists()
    data = json.loads(state_path.read_text(encoding="utf-8"))
    assert "images" in data
    assert len(data["images"]) == 10
