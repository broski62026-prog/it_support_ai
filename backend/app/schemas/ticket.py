from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class TicketResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_name: str
    conversation_id: int
    issue_description: str
    operating_system: str | None = None
    category: str | None = None
    priority: str
    status: str
    assigned_to: int | None = None
    resolution_notes: str | None = None
    created_at: datetime
    updated_at: datetime


class AdminTicketUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"] | None = None
    priority: Literal["low", "medium", "high"] | None = None
    resolution_notes: str | None = None


class AdminTicketAssign(BaseModel):
    assigned_to: int | None = None