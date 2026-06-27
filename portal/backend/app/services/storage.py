from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Iterable

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import engine
from app.models.customer import Customer


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
    run_patches()


def run_patches() -> None:
    insp = inspect(engine)
    for table in ("sites", "gateways", "industrial_devices"):
        if not insp.has_table(table):
            continue
        columns = {column["name"] for column in insp.get_columns(table)}
        if "lifecycle_status" not in columns:
            with engine.begin() as conn:
                conn.execute(
                    text(
                        f"ALTER TABLE {table} "
                        "ADD COLUMN lifecycle_status VARCHAR(40) DEFAULT 'active'"
                    )
                )


def seed_db(db: Session) -> None:
    # Remote Access must not invent customers, sites, gateways or grants.
    # Customers are synced from Hub when a real Hub token is present; the rest is
    # created explicitly by an admin/root user.
    if db.query(Customer).first():
        return
