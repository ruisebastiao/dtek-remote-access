from __future__ import annotations

from typing import Any

import httpx

from app.core.config import settings


def status() -> dict:
    configured = _is_configured()
    result = {
        "configured": configured,
        "connected": False,
        "read_only": True,
        "url": settings.headscale_url,
        "message": "",
    }
    if not configured:
        result["message"] = "HEADSCALE_URL e HEADSCALE_API_KEY ainda nao estao configurados."
        return result

    try:
        _request("GET", "/api/v1/node")
    except httpx.HTTPStatusError as exc:
        result["status_code"] = exc.response.status_code
        result["message"] = f"Headscale respondeu HTTP {exc.response.status_code}."
    except httpx.HTTPError as exc:
        result["message"] = f"Nao foi possivel contactar o Headscale: {exc.__class__.__name__}."
    else:
        result["connected"] = True
        result["message"] = "Headscale acessivel em modo read-only."
    return result


def nodes() -> dict:
    current_status = status()
    if not current_status["configured"] or not current_status["connected"]:
        return {**current_status, "nodes": []}

    try:
        payload = _request("GET", "/api/v1/node")
    except httpx.HTTPStatusError as exc:
        return {
            **current_status,
            "connected": False,
            "status_code": exc.response.status_code,
            "message": f"Headscale respondeu HTTP {exc.response.status_code}.",
            "nodes": [],
        }
    except httpx.HTTPError as exc:
        return {
            **current_status,
            "connected": False,
            "message": f"Nao foi possivel contactar o Headscale: {exc.__class__.__name__}.",
            "nodes": [],
        }

    return {**current_status, "nodes": [_normalize_node(item) for item in _extract_nodes(payload)]}


def _is_configured() -> bool:
    return bool(settings.headscale_url and settings.headscale_api_key)


def _request(method: str, path: str) -> Any:
    headers = {"Authorization": f"Bearer {settings.headscale_api_key}"}
    with httpx.Client(base_url=settings.headscale_url, timeout=settings.headscale_timeout) as client:
        response = client.request(method, path, headers=headers)
        response.raise_for_status()
        if not response.content:
            return {}
        return response.json()


def _extract_nodes(payload: Any) -> list[dict]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("nodes", "node", "machines", "machine"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _normalize_node(item: dict) -> dict:
    user = item.get("user") or item.get("namespace") or item.get("owner") or {}
    if isinstance(user, dict):
        user_name = user.get("name") or user.get("displayName") or user.get("id") or ""
    else:
        user_name = str(user)

    routes = _list_value(
        item.get("routes")
        or item.get("advertisedRoutes")
        or item.get("subnetRoutes")
        or item.get("approvedRoutes")
        or item.get("availableRoutes")
    )

    ip_addresses = _list_value(
        item.get("ipAddresses")
        or item.get("ip_addresses")
        or item.get("addresses")
        or item.get("ips")
    )

    return {
        "id": str(item.get("id") or item.get("nodeId") or item.get("machineKey") or ""),
        "name": item.get("name") or item.get("givenName") or item.get("hostname") or "",
        "user": user_name,
        "ip_address": _primary_ip(ip_addresses),
        "ip_addresses": ip_addresses,
        "online": bool(item.get("online") or item.get("isOnline")),
        "last_seen": item.get("lastSeen") or item.get("last_seen") or "",
        "routes": routes,
        "approved_routes": _list_value(item.get("approvedRoutes")),
        "available_routes": _list_value(item.get("availableRoutes")),
        "serving_routes": _list_value(item.get("subnetRoutes") or item.get("routes")),
    }


def _list_value(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]


def _primary_ip(addresses: list[str]) -> str:
    for address in addresses:
        if "." in address:
            return address
    return addresses[0] if addresses else ""
