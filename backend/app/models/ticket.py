
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    conversation_id = Column(
        Integer,
        ForeignKey("conversations.id"),
        nullable=False
    )

    # Technician assigned to handle this ticket
    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    issue_description = Column(Text, nullable=False)

    operating_system = Column(String(50), nullable=True)

    category = Column(String(100), nullable=True)

    priority = Column(String(20), default="medium")

    status = Column(String(30), default="open")

    resolution_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    employee = relationship("User", foreign_keys=[user_id])

    @property
    def employee_name(self):
        return self.employee.username
