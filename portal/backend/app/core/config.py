import os

from pydantic import BaseModel


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings(BaseModel):
    app_name: str = "DTEK Remote Access"
    platform_key: str = "remote_access"
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./remote_access_dev.db")

    jwt_secret: str = os.getenv("JWT_SECRET", "")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    cookie_name: str = os.getenv("COOKIE_NAME", "dtek_sso")
    hub_url: str = os.getenv("HUB_URL", "https://hub.dreamforit.com")
    dev_auth: bool = _bool("DEV_AUTH", True)

    cors_origins: list[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:8003,http://127.0.0.1:8003"
        ).split(",")
        if origin.strip()
    ]


settings = Settings()
