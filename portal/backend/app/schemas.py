from __future__ import annotations

from pydantic import BaseModel


class CustomerWrite(BaseModel):
    id: str
    name: str
    notes: str = ""


class SiteWrite(BaseModel):
    id: str
    customer_id: str
    name: str
    location: str = ""


class GatewayWrite(BaseModel):
    id: str
    customer_id: str
    site_id: str
    name: str
    kind: str = ""
    status: str = "offline"
    tailscale_ip: str = ""
    lan_routes: list[str] = []
    last_seen: str = ""


class IndustrialDeviceWrite(BaseModel):
    id: str
    customer_id: str
    site_id: str
    gateway_id: str
    name: str
    type: str = ""
    address: str = ""
    protocols: list[str] = []
    status: str = "unknown"

