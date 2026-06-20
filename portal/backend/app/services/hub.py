from __future__ import annotations

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.customer import Customer


def hub_customer_id(client_id: int | str) -> str:
    return f"hub_client_{client_id}"


def fetch_hub_clients(token: str) -> list[dict]:
    if not token or not settings.hub_url:
        return []
    url = settings.hub_url.rstrip("/") + "/api/clients"
    try:
        response = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=4.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        return []
    clients = response.json()
    if not isinstance(clients, list):
        return []
    result = []
    for client in clients:
        if not isinstance(client, dict) or "id" not in client:
            continue
        result.append(
            {
                "id": hub_customer_id(client["id"]),
                "hub_client_id": client["id"],
                "name": client.get("name") or f"Cliente {client['id']}",
                "notes": client.get("notes") or "",
                "source": "hub",
                "sites": [],
            }
        )
    return result


def sync_hub_clients(db: Session, clients: list[dict]) -> None:
    changed = False
    for client in clients:
        customer = db.get(Customer, client["id"])
        if customer:
            if customer.name != client["name"] or customer.notes != client["notes"]:
                customer.name = client["name"]
                customer.notes = client["notes"]
                changed = True
        else:
            db.add(Customer(id=client["id"], name=client["name"], notes=client["notes"]))
            changed = True
    if changed:
        db.commit()
