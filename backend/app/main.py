from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .routers import review

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title='ALTLUME API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)
app.include_router(review.router)
app.mount('/assets', StaticFiles(directory=str(BASE_DIR / 'assets')), name='assets')

@app.get('/api/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}
