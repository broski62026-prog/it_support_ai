from app.models.ticket import Ticket


def create_support_ticket(
    db,
    user_id: int,
    conversation_id: int,
    issue_description: str,
):
    ticket = Ticket(
        user_id=user_id,
        conversation_id=conversation_id,
        issue_description=issue_description,
        priority="medium",
        status="open",
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket