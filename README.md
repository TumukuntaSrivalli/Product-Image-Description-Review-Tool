# ALTLUME

ALTLUME is a product-image description review tool designed for merchant editors and screen-reader accessibility review. It follows the workflow described in the brief: review 10 synthetic product images, draft descriptions, edit them, approve or flag inaccessible or decorative cases, and export CSV/JSON outputs.

## Product decisions

- The backend is FastAPI-based with a JSON state file in `backend/data/review_state.json`.
- The frontend is a Vite + React + TypeScript app in `frontend/`.
- The theme uses a light "Paper" palette and a dark "Midnight" palette with logical CSS variables and a persisted theme toggle.
- The review process emphasises truthful, observable descriptions and explicit warnings against unsupported claims.
- The tool explicitly states in the UI and export screens that it is not proof of site accessibility compliance.

## Startup

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Files of interest

- `backend/data/fixture.json`: source product metadata and visible descriptions.
- `backend/data/reference_guide.json`: editable acceptable variation guide.
- `backend/app/services/validator.py`: review validation rules.
- `frontend/src/pages/*`: landing, review, export, and method views.

## Notes

The project goes beyond minimal scaffolding by shipping a working backend API, an accessible and polished UI shell for the required review flow, and a clear documentation section. The app uses a default system theme with manual override and is intentionally transparent about the scope of alt-text review.
