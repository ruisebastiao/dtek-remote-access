from __future__ import annotations

import jwt

from app.core.config import settings
from app.core.exceptions import AuthError

ISSUER = "dtek-webhub"


def decode_token(token: str) -> dict:
    if not settings.jwt_secret:
        raise AuthError("JWT_SECRET is not configured.", status_code=500)
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=ISSUER,
        )
    except jwt.ExpiredSignatureError as exc:
        raise AuthError("Session expired.", status_code=401) from exc
    except jwt.PyJWTError as exc:
        raise AuthError("Invalid authentication token.", status_code=401) from exc


def dev_user_payload() -> dict:
    return {
        "sub": "1",
        "name": "DreamForTek Root",
        "email": "root@dreamforit.com",
        "client_id": None,
        "role": "root",
        "platforms": {settings.platform_key: "root"},
        "iss": ISSUER,
    }

