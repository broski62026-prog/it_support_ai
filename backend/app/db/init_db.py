from app.db.database import Base, engine

# Import all models so SQLAlchemy registers them
from app.models import (
    User,
    Conversation,
    Message,
    Ticket,
    KnowledgeSolution,
)

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("All database tables created successfully!")


if __name__ == "__main__":
    create_tables()