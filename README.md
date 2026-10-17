# ALTLUME — Product Image Description Review Tool

> **Editorial Review Platform for Accessible E-Commerce Catalogues**
> Built with Amazon Seller Central / Catalog Studio ergonomics, real-time accessibility validation, and human-in-the-loop audit trails.

---

## 🌟 Key Highlights & Architectural Decisions

- **Amazon Catalog Ergonomics**: Clean 3-pane workflow (filmstrip thumbnail queue, high-magnification image pan/zoom viewer, structured editorial card with live validation and Amazon-grade 1-Click approval action).
- **Truth in Describing**: Enforces strict business rules that prevent unobservable claims (materials like cotton/leather/steel, certifications like ISO/CE, performance like waterproof/durable, and superlatives like premium/best). Offending words are highlighted live with interactive tooltips.
- **Provenance Transparency**: Every draft is stamped with its source label (`rule-based fallback` or `AI model (needs review)`).
- **Uncertainty & Ambiguity Kept Visible**:
  - Conflicting metadata or subjective words (e.g., "appears blue") surface an editable **"colour uncertain"** chip.
  - Visually duplicate illustrations (P01, P02, P04) carry an **"Identical to P01"** catalog badge.
- **Interactive 3D Hero (React Three Fiber)**: 10 floating rounded glass tiles matching the fixture colors (blue, red, black, grey, green) orbiting with a scanning light beam and dynamic typing caption.
  - *Easter Egg*: Typing `alt` on the landing page rearranges the tiles into the letters **A-L-T**.
- **Keyboard Shortcuts & Command Palette**: Complete keyboard operations via `J`/`K` navigation, `A` approve, `F` flag, `E` edit, `D` decorative, `G` generate draft, `T` theme toggle, `Ctrl+S` save, and `Ctrl+K` command palette via `cmdk`.
- **Export Integrity**: CSV export is UTF-8 with BOM (`utf-8-sig`), properly quoted, and protected against formula injection (`=`, `+`, `-`, `@` prefixed with apostrophe). All 10 product IDs are strictly preserved.
- **Mandatory Compliance Disclaimer**: Prominently notes in the UI header, footer, export studio, and methodology page that this tool alone does **NOT** prove overall site accessibility compliance or legal WCAG certification.

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React 19 + TypeScript, Tailwind CSS, Framer Motion, React Three Fiber + Three.js + @react-three/drei, Zustand, TanStack Query, cmdk, Sonner, Vitest + React Testing Library + vitest-axe.
- **Backend**: Python 3.12+, FastAPI, Pydantic v2, Uvicorn, pytest.
- **Persistence**: Atomic file writes to `backend/data/review_state.json` (no external database needed).

---

## 🚀 Getting Started

### 1. Backend Setup & Run

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base URL: `http://127.0.0.1:8000`
- API Health Check: `http://127.0.0.1:8000/api/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```
- Frontend Dev Server: `http://localhost:5173` (proxies `/api` and `/assets` to `http://127.0.0.1:8000`).

---

## 🧪 Testing

### Backend Unit & Integration Tests (pytest)
Runs 16 comprehensive tests covering business rules, edge cases, CSV round-trip, and state persistence:
```bash
cd backend
python -m pytest
```

### Frontend Tests & Accessibility Audit (vitest + vitest-axe)
Runs unit tests for client-side validators, word diff engine, and automated WCAG accessibility audits:
```bash
cd frontend
npm test
```

### Production Build Verification
```bash
cd frontend
npm run build
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `J` / `K` | Select Next / Previous Product |
| `E` | Focus Image Description Textarea |
| `A` | Approve & Publish Current Alt Text |
| `F` | Open Flag Inaccessible Dialog |
| `D` | Toggle Decorative Image (`alt=""`) |
| `G` | Regenerate Draft Description |
| `T` | Toggle Light ("Paper") / Dark ("Midnight") Theme |
| `Ctrl + S` | Save Current Review |
| `Ctrl + K` | Open Universal Command Palette |
| `?` | Open Keyboard Shortcuts Help Modal |

---

## 📋 Business Validation Rules

1. **Unsupported Claims**: Blocks unverifiable claims for material (*cotton, leather, ceramic, steel, silicone*), certification (*ISO, BIS, CE, organic*), performance (*waterproof, durable, ergonomic*), and superlatives (*premium, best, ultimate*).
2. **Length Rules**: Advisory warning above 125 characters; hard block above 250 characters; empty text blocked unless explicitly confirmed decorative.
3. **No Intro Redundancy**: Blocks descriptions starting with `"image of"`, `"picture of"`, or `"photo of"`.
4. **Colour Nuance**: Detects conflicts between metadata title and visible color, or ambiguous phrasing like `"appears blue"`, flagging them as `"colour uncertain"`.
5. **Decorative Confirmation**: Empty description (`alt=""`) permitted only upon explicit confirmation.
6. **Text Transcription**: If marked as containing text, the description must transcribe the visible copy.
7. **Multiple Products**: If marked as depicting multiple products, requires describing the group or set.
8. **Adjacent Context Overlap**: Warns if the description unnecessarily duplicates copy present in adjacent page context.
9. **Mutation Re-Review**: Any edit to an already approved item resets its status to `"needs re-review"`.

---

## ⚠️ Limitations & Honest Disclaimer

- This is a bounded prototype operating on synthetic fixture dataset `C04`.
- Market demand, willingness to pay, and production performance remain unproven.
- Alternative text alone is only one component of web accessibility (WCAG 2.1 SC 1.1.1); full compliance requires comprehensive audits covering keyboard navigation, focus management, color contrast, and assistive device evaluation.
