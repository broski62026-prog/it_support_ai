
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.api.routes.auth import get_current_user
from app.schemas.ticket import TicketResponse

router = APIRouter(prefix="/api/tickets", tags=["IT Support Tickets"])


# Employee: View their own tickets
@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.employee))
        .filter(Ticket.user_id == current_user.id)
        .order_by(Ticket.created_at.desc())
        .all()
    )

    return tickets


# Employee: View details of one of their own tickets
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_details(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.employee))
        .filter(
            Ticket.id == ticket_id,
            Ticket.user_id == current_user.id,
        )
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket
