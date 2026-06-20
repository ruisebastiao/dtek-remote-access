from __future__ import annotations

from fastapi import Request

from app.core.config import settings
from app.core.exceptions import AuthError
from app.services.auth import decode_token, dev_user_payload


class TokenUser:
    def __init__(self, payload: dict, token: str = "") -> None:
        self.token = token
        self.id = str(payload.get("sub", ""))
        self.name = payload.get("name", "")
        self.email = payload.get("email", "")
        self.client_id = payload.get("client_id")
        self.role = payload.get("role", "")
        self.platforms = payload.get("platforms") or {}

    @property
    def platform_role(self) -> str:
        if isinstance(self.platforms, dict):
            return self.platforms.get(settings.platform_key, "")
        return ""

    @property
    def id_int(self) -> int:
        try:
            return int(self.id)
        except (TypeError, ValueError):
            return -1


def _extract_token(request: Request) -> str:
    token = request.cookies.get(settings.cookie_name)
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return ""


def get_current_user(request: Request) -> TokenUser:
    token = _extract_token(request)
    if token:
        user = TokenUser(decode_token(token), token=token)
    elif settings.dev_auth:
        user = TokenUser(dev_user_payload())
    else:
        raise AuthError("Not authenticated.", status_code=401)

    if user.role in {"root", "admin"}:
        return user
    if not user.platform_role:
        raise AuthError("Remote Access entitlement is missing.", status_code=403)
    return user


def require_remote_roles(*roles: str):
    def _checker(request: Request) -> TokenUser:
        user = get_current_user(request)
        if user.role in {"root", "admin"}:
            return user
        if roles and user.platform_role not in roles:
            raise AuthError("Insufficient Remote Access permissions.", status_code=403)
        return user

    return _checker
