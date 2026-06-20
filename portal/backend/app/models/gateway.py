from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Gateway(Base):
    __tablename__ = "gateways"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    customer_id: Mapped[str] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), index=True
    )
    site_id: Mapped[str] = mapped_column(ForeignKey("sites.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    kind: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(40), default="offline", index=True)
    lifecycle_status: Mapped[str] = mapped_column(String(40), default="active", index=True)
    tailscale_ip: Mapped[str] = mapped_column(String(80), default="")
    lan_routes: Mapped[str] = mapped_column(Text, default="[]")
    last_seen: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    site: Mapped["Site"] = relationship(back_populates="gateways")  # noqa: F821
    devices: Mapped[list["IndustrialDevice"]] = relationship(  # noqa: F821
        back_populates="gateway", cascade="all, delete-orphan"
    )
