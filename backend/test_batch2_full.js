// Automated verification of VernX Batch 1 & Batch 2 requirements
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('=== VERNX BATCH 1 & BATCH 2 VERIFICATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: P01-P10 Baseline & Fixture Integrity
  console.log('--- TEST 1: P01-P10 Baseline & Fixture Integrity ---');
  try {
    const res = await fetch('http://localhost:5000/api/images');
    const data = await res.json();
    assert(Array.isArray(data.images) && data.images.length === 10, 'P01-P10 images loaded (exactly 10 records)');
    const ids = data.images.map(i => i.product_id);
    assert(ids.includes('P01') && ids.includes('P10'), 'Queue contains P01 through P10');
  } catch (e) {
    assert(false, `Test 1 failed: ${e.message}`);
  }

  // TEST 2: Batch 1 Single-Product Intelligence
  console.log('\n--- TEST 2: Batch 1 Single-Product Intelligence ---');
  try {
    const res = await fetch('http://localhost:5000/analyze-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'P01',
        productName: 'Stainless Steel Insulated Water Bottle',
        category: 'Drinkware',
      }),
    });
    const data = await res.json();
    assert(data.success === true, 'P01 intelligence endpoint responds successfully');
    assert(data.product?.product_name || data.product?.category, `Product identified: ${data.product?.product_name || data.product?.category}`);
    assert(Array.isArray(data.verification_questions), 'Category verification questions generated');
    assert(Array.isArray(data.recommended_highlights), 'Catalogue highlights generated');
  } catch (e) {
    assert(false, `Test 2 failed: ${e.message}`);
  }

  // TEST 3: Multi-Image View Coverage Checklists
  console.log('\n--- TEST 3: Multi-Image View Coverage Checklists ---');
  try {
    // Clothing with front only (1 of 4 expected: front, back, side, detail => 25%)
    const res1 = await fetch('http://localhost:5000/api/multi-image/coverage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'Clothing', images: [{ view: 'front' }] }),
    });
    const cov1 = await res1.json();
    assert(cov1.coverage.score === 25, `Clothing front-only score is 25% (got ${cov1.coverage.score}%)`);
    assert(cov1.coverage.is_single_view === true, 'Clothing front-only marked as single view');
    assert(cov1.coverage.recommendation.includes('back'), `Clothing recommendation suggests back view: "${cov1.coverage.recommendation}"`);

    // Shoes with top, left, right, heel, sole (5 of 5 expected => 100%)
    const res2 = await fetch('http://localhost:5000/api/multi-image/coverage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Shoes',
        images: [{ view: 'top' }, { view: 'left' }, { view: 'right' }, { view: 'heel' }, { view: 'sole' }],
      }),
    });
    const cov2 = await res2.json();
    assert(cov2.coverage.score === 100, `Shoes 5-angle score is 100% (got ${cov2.coverage.score}%)`);
    assert(cov2.coverage.missing_views.length === 0, 'No missing views for complete shoe coverage');

    // Electronics with front and ports (2 of 4 expected: front, back, side, ports => 50%)
    const res3 = await fetch('http://localhost:5000/api/multi-image/coverage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Electronics',
        images: [{ view: 'front' }, { view: 'ports' }],
      }),
    });
    const cov3 = await res3.json();
    assert(cov3.coverage.score === 50, `Electronics front+ports score is 50% (got ${cov3.coverage.score}%)`);
    assert(cov3.coverage.expected_views.includes('ports'), 'Electronics checklist includes ports');
  } catch (e) {
    assert(false, `Test 3 failed: ${e.message}`);
  }

  // TEST 4: Multi-Image AI Grouping & View Detection
  console.log('\n--- TEST 4: Multi-Image AI Grouping & View Detection ---');
  try {
    const sampleB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await fetch('http://localhost:5000/api/multi-image/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: [
          { id: 'img-1', name: 'tshirt_front.png', url: sampleB64 },
          { id: 'img-2', name: 'tshirt_back.png', url: sampleB64 },
          { id: 'img-3', name: 'water_bottle.png', url: sampleB64 },
        ],
      }),
    });
    const data = await res.json();
    assert(data.success === true, 'Grouping endpoint responded successfully');
    const groups = data.groups || data.suggested_groups || [];
    assert(Array.isArray(groups) && groups.length >= 1, `AI returned ${groups.length} group(s)`);
    const firstGroupImages = groups[0]?.images || [];
    assert(firstGroupImages.length > 0 && firstGroupImages[0].view !== undefined, `Images have view detection (e.g. view: "${firstGroupImages[0]?.view}")`);
  } catch (e) {
    assert(false, `Test 4 failed: ${e.message}`);
  }

  // TEST 5: Multi-View Analysis with source_view Tagging
  console.log('\n--- TEST 5: Multi-View Analysis with source_view Tagging ---');
  try {
    const sampleB64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const res = await fetch('http://localhost:5000/api/multi-image/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'UPLOAD-001',
        productName: 'Sports Running Shoes',
        category: 'Shoes',
        images: [
          { id: 'view-1', view: 'top', url: sampleB64 },
          { id: 'view-2', view: 'sole', url: sampleB64 },
        ],
      }),
    });
    const data = await res.json();
    assert(data.success === true, 'Multi-view analysis endpoint responded successfully');
    const feats = data.detected_features || data.visual_features || [];
    assert(Array.isArray(feats) && feats.length > 0, `Detected features returned (${feats.length} features)`);
    const taggedWithView = feats.filter(f => f.source_view !== undefined);
    assert(taggedWithView.length === feats.length, `All ${feats.length} features tagged with source_view`);
    assert(data.view_coverage !== undefined, `View coverage calculated: ${data.view_coverage?.score}%`);
  } catch (e) {
    assert(false, `Test 5 failed: ${e.message}`);
  }

  // TEST 6: CSV Export Backward Compatibility & Append Columns
  console.log('\n--- TEST 6: CSV Export Backward Compatibility ---');
  try {
    const res = await fetch('http://localhost:5000/api/export/csv');
    const csv = await res.text();
    const lines = csv.trim().split('\r\n');
    const headers = lines[0].replace('\uFEFF', '').split(',');
    assert(headers[0] === 'product_id', 'Column 1 is product_id');
    assert(headers[3] === 'description', 'Column 4 is description');
    assert(headers[7] === 'status', 'Column 8 is status');
    assert(headers[11] === 'image_count', 'Column 12 is image_count');
    assert(headers[12] === 'view_coverage', 'Column 13 is view_coverage');
    assert(lines.length >= 11, `CSV contains header plus at least 10 product rows (got ${lines.length} lines)`);
  } catch (e) {
    assert(false, `Test 6 failed: ${e.message}`);
  }

  // TEST 7: Security Check: API Key Protection
  console.log('\n--- TEST 7: Security Check: API Key Protection ---');
  try {
    const actualKey = process.env.GEMINI_API_KEY;
    const frontendDist = fs.existsSync(path.resolve(__dirname, '../frontend/dist/assets'))
      ? fs.readdirSync(path.resolve(__dirname, '../frontend/dist/assets'))
      : [];
    let leakedInBuild = false;
    frontendDist.forEach(file => {
      const content = fs.readFileSync(path.resolve(__dirname, '../frontend/dist/assets', file), 'utf-8');
      if (content.includes('AIzaSy') || (actualKey && actualKey.length > 10 && content.includes(actualKey))) {
        leakedInBuild = true;
      }
    });
    assert(!leakedInBuild, 'GEMINI_API_KEY is NOT exposed in frontend build bundles');
    
    // Check App.jsx
    const appJsx = fs.readFileSync(path.resolve(__dirname, '../frontend/src/App.jsx'), 'utf-8');
    const leakedInSource = appJsx.includes('AIzaSy') || (actualKey && actualKey.length > 10 && appJsx.includes(actualKey));
    assert(!leakedInSource, 'Frontend source does NOT contain Gemini API key');
  } catch (e) {
    assert(false, `Test 7 failed: ${e.message}`);
  }

  console.log(`\n========================================`);
  console.log(`FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);
  setTimeout(() => {
    process.exit(failed === 0 ? 0 : 1);
  }, 200);
}

runTests();
