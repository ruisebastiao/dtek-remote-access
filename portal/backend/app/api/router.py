from fastapi import APIRouter, Depends

from app.api.deps import TokenUser, get_current_user, require_remote_roles
from app.core.config import settings
from app.services import mock_data

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "dtek-remote-access"}


@router.get("/me")
def me(user: TokenUser = Depends(get_current_user)) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "client_id": user.client_id,
        "hub_role": user.role,
        "remote_role": user.platform_role or ("root" if user.role == "root" else ""),
        "platform_key": settings.platform_key,
        "dev_auth": settings.dev_auth,
    }


@router.get("/overview")
def overview(_user: TokenUser = Depends(get_current_user)) -> dict:
    return mock_data.overview()


@router.get("/users")
def users(_user: TokenUser = Depends(require_remote_roles("admin", "root"))) -> dict:
    return {"users": mock_data.USERS}


@router.get("/access-grants")
def access_grants(_user: TokenUser = Depends(require_remote_roles("operator", "admin", "root"))) -> dict:
    return {
        "grants": [
            {
                "id": "grant_root_all",
                "hub_user_id": 1,
                "scope": "all",
                "protocols": ["ssh", "rdp", "vnc", "http", "https"],
                "expires_at": None,
                "requires_approval": False,
            },
            {
                "id": "grant_tech_maxiplas",
                "hub_user_id": 2,
                "scope": "cust_maxiplas",
                "protocols": ["rdp", "http", "ssh"],
                "expires_at": None,
                "requires_approval": False,
            },
            {
                "id": "grant_client_view",
                "hub_user_id": 3,
                "scope": "site_maxiplas_linha1",
                "protocols": ["http"],
                "expires_at": None,
                "requires_approval": True,
            },
        ]
    }

