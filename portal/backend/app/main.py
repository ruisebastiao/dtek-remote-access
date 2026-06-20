from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import router
from app.core.config import settings
from app.core.exceptions import AuthError

app = FastAPI(title="DTEK Remote Access API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AuthError)
def handle_auth_error(_request, exc: AuthError):
    return JSONResponse(status_code=exc.status_code, content={"message": exc.message})


app.include_router(router, prefix="/api")

_static_dir = Path(__file__).parent / "static"
if _static_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_static_dir), html=True), name="static")

