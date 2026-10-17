from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .routers import review

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="ALTLUME API",
    description="Product Image Description Review Tool API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review.router)

# Graceful placeholder fallback endpoint for missing image assets
@app.get("/assets/{filename}")
def get_asset(filename: str):
    file_path = ASSETS_DIR / filename
    if file_path.is_file():
        # determine media type
        suffix = file_path.suffix.lower()
        media_type = "image/png" if suffix == ".png" else "image/jpeg"
        return Response(content=file_path.read_bytes(), media_type=media_type)
    
    # Graceful SVG placeholder if missing
    svg_placeholder = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
        <rect width="400" height="300" fill="#232F3E" rx="8" />
        <rect x="20" y="20" width="360" height="260" fill="none" stroke="#F59E0B" stroke-dasharray="6,6" stroke-width="2" rx="6" />
        <circle cx="200" cy="120" r="36" fill="#131921" stroke="#4F46E5" stroke-width="2" />
        <path d="M185 120 L215 120 M200 105 L200 135" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" />
        <text x="200" y="180" text-anchor="middle" fill="#F6F3EE" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Image Asset Missing</text>
        <text x="200" y="205" text-anchor="middle" fill="#9CA3AF" font-family="system-ui, sans-serif" font-size="12">{filename}</text>
    </svg>"""
    return Response(content=svg_placeholder, media_type="image/svg+xml")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "ALTLUME"}
