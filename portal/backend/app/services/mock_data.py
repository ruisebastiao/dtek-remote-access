from __future__ import annotations

from datetime import datetime, timezone


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


CUSTOMERS = [
    {
        "id": "cust_maxiplas",
        "name": "Maxiplas",
        "sites": [
            {
                "id": "site_maxiplas_linha1",
                "name": "Linha 1",
                "location": "Fabrica principal",
            }
        ],
    },
    {
        "id": "cust_demo",
        "name": "Cliente Demo",
        "sites": [
            {
                "id": "site_demo_lab",
                "name": "Lab remoto",
                "location": "Ambiente de testes",
            }
        ],
    },
]

GATEWAYS = [
    {
        "id": "gw_maxiplas_01",
        "customer_id": "cust_maxiplas",
        "site_id": "site_maxiplas_linha1",
        "name": "GW-MAXIPLAS-01",
        "kind": "Raspberry Pi / Debian",
        "status": "online",
        "tailscale_ip": "100.64.10.11",
        "lan_routes": ["192.168.10.0/24"],
        "last_seen": _now(),
    },
    {
        "id": "gw_demo_01",
        "customer_id": "cust_demo",
        "site_id": "site_demo_lab",
        "name": "GW-DEMO-01",
        "kind": "Mini-PC industrial",
        "status": "offline",
        "tailscale_ip": "100.64.10.25",
        "lan_routes": ["192.168.77.0/24"],
        "last_seen": "2026-06-20T10:12:00+00:00",
    },
]

INDUSTRIAL_DEVICES = [
    {
        "id": "dev_maxiplas_hmi_long",
        "customer_id": "cust_maxiplas",
        "site_id": "site_maxiplas_linha1",
        "gateway_id": "gw_maxiplas_01",
        "name": "MAXIPLAS_LONG_SIDE",
        "type": "HMI",
        "address": "192.168.10.21",
        "protocols": ["http", "rdp"],
        "status": "reachable",
    },
    {
        "id": "dev_maxiplas_hmi_short",
        "customer_id": "cust_maxiplas",
        "site_id": "site_maxiplas_linha1",
        "gateway_id": "gw_maxiplas_01",
        "name": "MAXIPLAS_SHORT_SIDE",
        "type": "HMI",
        "address": "192.168.10.22",
        "protocols": ["http", "rdp"],
        "status": "reachable",
    },
    {
        "id": "dev_demo_plc",
        "customer_id": "cust_demo",
        "site_id": "site_demo_lab",
        "gateway_id": "gw_demo_01",
        "name": "PLC-DEMO-01",
        "type": "PLC",
        "address": "192.168.77.10",
        "protocols": ["ssh", "http"],
        "status": "unknown",
    },
]

USERS = [
    {
        "hub_user_id": 1,
        "name": "DreamForTek Root",
        "email": "root@dreamforit.com",
        "client_id": None,
        "hub_role": "root",
        "remote_role": "root",
        "grants": ["all"],
        "status": "active",
    },
    {
        "hub_user_id": 2,
        "name": "Tecnico DTEK",
        "email": "tecnico@dreamforit.com",
        "client_id": None,
        "hub_role": "admin",
        "remote_role": "operator",
        "grants": ["cust_maxiplas"],
        "status": "active",
    },
    {
        "hub_user_id": 3,
        "name": "Cliente Maxiplas",
        "email": "cliente@maxiplas.pt",
        "client_id": "cust_maxiplas",
        "hub_role": "member",
        "remote_role": "viewer",
        "grants": ["site_maxiplas_linha1"],
        "status": "active",
    },
]


def overview() -> dict:
    online_gateways = [g for g in GATEWAYS if g["status"] == "online"]
    return {
        "stats": {
            "customers": len(CUSTOMERS),
            "sites": sum(len(c["sites"]) for c in CUSTOMERS),
            "gateways": len(GATEWAYS),
            "gateways_online": len(online_gateways),
            "devices": len(INDUSTRIAL_DEVICES),
            "users": len(USERS),
        },
        "customers": CUSTOMERS,
        "gateways": GATEWAYS,
        "devices": INDUSTRIAL_DEVICES,
        "recent_events": [
            {
                "time": _now(),
                "level": "info",
                "message": "Dev seed loaded; Headscale adapter not connected yet.",
            },
            {
                "time": "2026-06-20T22:45:00+00:00",
                "level": "warning",
                "message": "GW-DEMO-01 offline; last heartbeat is stale.",
            },
        ],
    }

