from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import TokenUser, get_current_user, require_remote_roles
from app.core.config import settings
from app.core.exceptions import AuthError
from app.db.session import get_db
from app.models.access_grant import AccessGrant
from app.models.customer import Customer
from app.models.gateway import Gateway
from app.models.industrial_device import IndustrialDevice
from app.models.site import Site
from app.schemas import CustomerWrite, GatewayWrite, IndustrialDeviceWrite, SiteWrite
from app.services import mock_data
from app.services.hub import fetch_hub_clients, sync_hub_clients
from app.services.storage import pack_list, unpack_list, utc_now

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
def overview(
    user: TokenUser = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    customers = _customer_list_for_user(db, user)
    customer_ids = {customer["id"] for customer in customers}
    gateways_query = db.query(Gateway).order_by(Gateway.name.asc())
    devices_query = db.query(IndustrialDevice).order_by(IndustrialDevice.name.asc())
    if customer_ids:
        gateways_query = gateways_query.filter(Gateway.customer_id.in_(customer_ids))
        devices_query = devices_query.filter(IndustrialDevice.customer_id.in_(customer_ids))
    gateways = [_gateway_read(g) for g in gateways_query.all()]
    devices = [
        _device_read(d) for d in devices_query.all()
    ]
    online_gateways = [g for g in gateways if g["status"] == "online"]
    return {
        "stats": {
            "customers": len(customers),
            "sites": sum(len(customer["sites"]) for customer in customers),
            "gateways": len(gateways),
            "gateways_online": len(online_gateways),
            "devices": len(devices),
            "users": len(mock_data.USERS),
        },
        "customers": customers,
        "gateways": gateways,
        "devices": devices,
        "recent_events": [
            {
                "time": utc_now(),
                "level": "info",
                "message": "Persistent dev database loaded; Headscale adapter not connected yet.",
            }
        ],
    }


@router.get("/users")
def users(_user: TokenUser = Depends(require_remote_roles("admin", "root"))) -> dict:
    return {"users": mock_data.USERS}


@router.get("/access-grants")
def access_grants(
    _user: TokenUser = Depends(require_remote_roles("operator", "admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    return {"grants": [_grant_read(g) for g in db.query(AccessGrant).order_by(AccessGrant.id).all()]}


@router.get("/customers")
def list_customers(
    user: TokenUser = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    return {"customers": _customer_list_for_user(db, user)}


@router.post("/customers", status_code=201)
def create_customer(
    payload: CustomerWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    if db.get(Customer, payload.id):
        raise AuthError("Customer already exists.", 409)
    customer = Customer(id=payload.id, name=payload.name, notes=payload.notes)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return _customer_read(customer)


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: str,
    payload: CustomerWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    customer = _get_or_404(db, Customer, customer_id, "Customer")
    customer.name = payload.name
    customer.notes = payload.notes
    db.commit()
    db.refresh(customer)
    return _customer_read(customer)


@router.delete("/customers/{customer_id}", status_code=204)
def delete_customer(
    customer_id: str,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> None:
    customer = _get_or_404(db, Customer, customer_id, "Customer")
    db.delete(customer)
    db.commit()


@router.get("/sites")
def list_sites(_user: TokenUser = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return {"sites": [_site_read(s) for s in db.query(Site).order_by(Site.name.asc()).all()]}


@router.post("/sites", status_code=201)
def create_site(
    payload: SiteWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    if db.get(Site, payload.id):
        raise AuthError("Site already exists.", 409)
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    site = Site(**payload.model_dump())
    db.add(site)
    db.commit()
    db.refresh(site)
    return _site_read(site)


@router.put("/sites/{site_id}")
def update_site(
    site_id: str,
    payload: SiteWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    site = _get_or_404(db, Site, site_id, "Site")
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    site.customer_id = payload.customer_id
    site.name = payload.name
    site.location = payload.location
    db.commit()
    db.refresh(site)
    return _site_read(site)


@router.get("/gateways")
def list_gateways(
    _user: TokenUser = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    return {"gateways": [_gateway_read(g) for g in db.query(Gateway).order_by(Gateway.name.asc()).all()]}


@router.post("/gateways", status_code=201)
def create_gateway(
    payload: GatewayWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    if db.get(Gateway, payload.id):
        raise AuthError("Gateway already exists.", 409)
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    _get_or_404(db, Site, payload.site_id, "Site")
    data = payload.model_dump()
    data["lan_routes"] = pack_list(payload.lan_routes)
    gateway = Gateway(**data)
    db.add(gateway)
    db.commit()
    db.refresh(gateway)
    return _gateway_read(gateway)


@router.put("/gateways/{gateway_id}")
def update_gateway(
    gateway_id: str,
    payload: GatewayWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    gateway = _get_or_404(db, Gateway, gateway_id, "Gateway")
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    _get_or_404(db, Site, payload.site_id, "Site")
    gateway.customer_id = payload.customer_id
    gateway.site_id = payload.site_id
    gateway.name = payload.name
    gateway.kind = payload.kind
    gateway.status = payload.status
    gateway.tailscale_ip = payload.tailscale_ip
    gateway.lan_routes = pack_list(payload.lan_routes)
    gateway.last_seen = payload.last_seen
    db.commit()
    db.refresh(gateway)
    return _gateway_read(gateway)


@router.get("/devices")
def list_devices(
    _user: TokenUser = Depends(get_current_user), db: Session = Depends(get_db)
) -> dict:
    return {
        "devices": [
            _device_read(d) for d in db.query(IndustrialDevice).order_by(IndustrialDevice.name.asc()).all()
        ]
    }


@router.post("/devices", status_code=201)
def create_device(
    payload: IndustrialDeviceWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    if db.get(IndustrialDevice, payload.id):
        raise AuthError("Industrial device already exists.", 409)
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    _get_or_404(db, Site, payload.site_id, "Site")
    _get_or_404(db, Gateway, payload.gateway_id, "Gateway")
    data = payload.model_dump()
    data["protocols"] = pack_list(payload.protocols)
    device = IndustrialDevice(**data)
    db.add(device)
    db.commit()
    db.refresh(device)
    return _device_read(device)


@router.put("/devices/{device_id}")
def update_device(
    device_id: str,
    payload: IndustrialDeviceWrite,
    _user: TokenUser = Depends(require_remote_roles("admin", "root")),
    db: Session = Depends(get_db),
) -> dict:
    device = _get_or_404(db, IndustrialDevice, device_id, "Industrial device")
    _get_or_404(db, Customer, payload.customer_id, "Customer")
    _get_or_404(db, Site, payload.site_id, "Site")
    _get_or_404(db, Gateway, payload.gateway_id, "Gateway")
    device.customer_id = payload.customer_id
    device.site_id = payload.site_id
    device.gateway_id = payload.gateway_id
    device.name = payload.name
    device.type = payload.type
    device.address = payload.address
    device.protocols = pack_list(payload.protocols)
    device.status = payload.status
    db.commit()
    db.refresh(device)
    return _device_read(device)


def _get_or_404(db: Session, model, item_id: str, label: str):
    item = db.get(model, item_id)
    if not item:
        raise AuthError(f"{label} not found.", 404)
    return item


def _customer_read(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "notes": customer.notes,
        "source": "hub" if customer.id.startswith("hub_client_") else "local",
        "sites": [_site_read(s) for s in sorted(customer.sites, key=lambda item: item.name)],
    }


def _customer_list_for_user(db: Session, user: TokenUser) -> list[dict]:
    hub_clients = fetch_hub_clients(user.token)
    if hub_clients:
        sync_hub_clients(db, hub_clients)
        hub_ids = {client["id"] for client in hub_clients}
        rows = (
            db.query(Customer)
            .filter(Customer.id.in_(hub_ids))
            .order_by(Customer.name.asc())
            .all()
        )
        return [_customer_read(c) for c in rows]
    return [_customer_read(c) for c in db.query(Customer).order_by(Customer.name.asc()).all()]


def _site_read(site: Site) -> dict:
    return {
        "id": site.id,
        "customer_id": site.customer_id,
        "name": site.name,
        "location": site.location,
    }


def _gateway_read(gateway: Gateway) -> dict:
    return {
        "id": gateway.id,
        "customer_id": gateway.customer_id,
        "site_id": gateway.site_id,
        "name": gateway.name,
        "kind": gateway.kind,
        "status": gateway.status,
        "tailscale_ip": gateway.tailscale_ip,
        "lan_routes": unpack_list(gateway.lan_routes),
        "last_seen": gateway.last_seen,
    }


def _device_read(device: IndustrialDevice) -> dict:
    return {
        "id": device.id,
        "customer_id": device.customer_id,
        "site_id": device.site_id,
        "gateway_id": device.gateway_id,
        "name": device.name,
        "type": device.type,
        "address": device.address,
        "protocols": unpack_list(device.protocols),
        "status": device.status,
    }


def _grant_read(grant: AccessGrant) -> dict:
    return {
        "id": grant.id,
        "hub_user_id": grant.hub_user_id,
        "scope": grant.scope,
        "protocols": unpack_list(grant.protocols),
        "expires_at": grant.expires_at or None,
        "requires_approval": grant.requires_approval,
    }
