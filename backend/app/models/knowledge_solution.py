from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector

from app.db.database import Base


class KnowledgeSolution(Base):
    __tablename__ = "knowledge_solutions"

    id = Column(Integer, primary_key=True, index=True)

    issue_description = Column(Text, nullable=False)

    solution = Column(Text, nullable=False)

    operating_system = Column(String(50), nullable=True)

    category = Column(String(100), nullable=True)

    embedding = Column(Vector(384), nullable=False)

    is_verified = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())