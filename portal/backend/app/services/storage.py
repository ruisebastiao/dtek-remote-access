from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine
from app.models.access_grant import AccessGrant
from app.models.customer import Customer
from app.models.gateway import Gateway
from app.models.industrial_device import IndustrialDevice
from app.models.site import Site


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def pack_list(values: Iterable[str] | None) -> str:
    return json.dumps(list(values or []))


def unpack_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return []
    return value if isinstance(value, list) else []


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def seed_db(db: Session) -> None:
    if db.query(Customer).first():
        return

    customers = [
        Customer(id="cust_maxiplas", name="Maxiplas", notes="Cliente industrial de referencia."),
        Customer(id="cust_demo", name="Cliente Demo", notes="Ambiente interno de testes."),
    ]
    db.add_all(customers)

    sites = [
        Site(
            id="site_maxiplas_linha1",
            customer_id="cust_maxiplas",
            name="Linha 1",
            location="Fabrica principal",
        ),
        Site(
            id="site_demo_lab",
            customer_id="cust_demo",
            name="Lab remoto",
            location="Ambiente de testes",
        ),
    ]
    db.add_all(sites)

    gateways = [
        Gateway(
            id="gw_maxiplas_01",
            customer_id="cust_maxiplas",
            site_id="site_maxiplas_linha1",
            name="GW-MAXIPLAS-01",
            kind="Raspberry Pi / Debian",
            status="online",
            tailscale_ip="100.64.10.11",
            lan_routes=pack_list(["192.168.10.0/24"]),
            last_seen=utc_now(),
        ),
        Gateway(
            id="gw_demo_01",
            customer_id="cust_demo",
            site_id="site_demo_lab",
            name="GW-DEMO-01",
            kind="Mini-PC industrial",
            status="offline",
            tailscale_ip="100.64.10.25",
            lan_routes=pack_list(["192.168.77.0/24"]),
            last_seen="2026-06-20T10:12:00+00:00",
        ),
    ]
    db.add_all(gateways)

    devices = [
        IndustrialDevice(
            id="dev_maxiplas_hmi_long",
            customer_id="cust_maxiplas",
            site_id="site_maxiplas_linha1",
            gateway_id="gw_maxiplas_01",
            name="MAXIPLAS_LONG_SIDE",
            type="HMI",
            address="192.168.10.21",
            protocols=pack_list(["http", "rdp"]),
            status="reachable",
        ),
        IndustrialDevice(
            id="dev_maxiplas_hmi_short",
            customer_id="cust_maxiplas",
            site_id="site_maxiplas_linha1",
            gateway_id="gw_maxiplas_01",
            name="MAXIPLAS_SHORT_SIDE",
            type="HMI",
            address="192.168.10.22",
            protocols=pack_list(["http", "rdp"]),
            status="reachable",
        ),
        IndustrialDevice(
            id="dev_demo_plc",
            customer_id="cust_demo",
            site_id="site_demo_lab",
            gateway_id="gw_demo_01",
            name="PLC-DEMO-01",
            type="PLC",
            address="192.168.77.10",
            protocols=pack_list(["ssh", "http"]),
            status="unknown",
        ),
    ]
    db.add_all(devices)

    grants = [
        AccessGrant(
            id="grant_root_all",
            hub_user_id=1,
            scope="all",
            protocols=pack_list(["ssh", "rdp", "vnc", "http", "https"]),
            expires_at="",
            requires_approval=False,
        ),
        AccessGrant(
            id="grant_tech_maxiplas",
            hub_user_id=2,
            scope="cust_maxiplas",
            protocols=pack_list(["rdp", "http", "ssh"]),
            expires_at="",
            requires_approval=False,
        ),
        AccessGrant(
            id="grant_client_view",
            hub_user_id=3,
            scope="site_maxiplas_linha1",
            protocols=pack_list(["http"]),
            expires_at="",
            requires_approval=True,
        ),
    ]
    db.add_all(grants)
    db.commit()

