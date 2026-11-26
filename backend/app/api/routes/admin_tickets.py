
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.database import get_db
from app.models.user import User
from app.models.ticket import Ticket
from app.api.routes.auth import get_current_user
from app.schemas.ticket import (
    TicketResponse,
    AdminTicketUpdate,
    AdminTicketAssign,
)


router = APIRouter(
    prefix="/api/admin/tickets",
    tags=["Admin Ticket Management"],
)


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )
    return current_user


# GET ticket statistics summary
@router.get("/summary")
def get_ticket_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    total_tickets = db.query(Ticket).count()

    open_tickets = db.query(Ticket).filter(
        Ticket.status == "open"
    ).count()

    in_progress_tickets = db.query(Ticket).filter(
        Ticket.status == "in_progress"
    ).count()

    resolved_tickets = db.query(Ticket).filter(
        Ticket.status == "resolved"
    ).count()

    closed_tickets = db.query(Ticket).filter(
        Ticket.status == "closed"
    ).count()

    low_priority = db.query(Ticket).filter(
        Ticket.priority == "low"
    ).count()

    medium_priority = db.query(Ticket).filter(
        Ticket.priority == "medium"
    ).count()

    high_priority = db.query(Ticket).filter(
        Ticket.priority == "high"
    ).count()

    return {
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "in_progress_tickets": in_progress_tickets,
        "resolved_tickets": resolved_tickets,
        "closed_tickets": closed_tickets,
        "low_priority": low_priority,
        "medium_priority": medium_priority,
        "high_priority": high_priority,
    }


# GET all tickets with filters, search, and pagination
@router.get("/", response_model=list[TicketResponse])
def get_all_tickets(
    status: Literal["open", "in_progress", "resolved", "closed"] | None = Query(default=None),
    priority: Literal["low", "medium", "high"] | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1),
    assigned_to: int | None = Query(default=None, ge=1),
    unassigned: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    query = db.query(Ticket).options(joinedload(Ticket.employee))

    # Filter by ticket status
    if status:
        query = query.filter(Ticket.status == status)

    # Filter by priority
    if priority:
        query = query.filter(Ticket.priority == priority)

    # Filter by assigned IT staff
    if assigned_to is not None:
        query = query.filter(Ticket.assigned_to == assigned_to)

    # Filter unassigned tickets
    if unassigned:
        if assigned_to is not None:
            raise HTTPException(
                status_code=400,
                detail="Use either assigned_to or unassigned, not both",
            )

        query = query.filter(Ticket.assigned_to.is_(None))

    # Search by employee username or issue description
    if search:
        search_term = f"%{search.strip()}%"

        query = query.join(
            User,
            Ticket.user_id == User.id,
        ).filter(
            (User.username.ilike(search_term))
            | (Ticket.issue_description.ilike(search_term))
        )

    # Newest tickets first, with pagination
    tickets = (
        query.order_by(Ticket.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return tickets


# GET a single ticket by ID
@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket_by_id(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.employee))
        .filter(Ticket.id == ticket_id)
        .first()
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    return ticket


# PATCH update ticket details
@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    data: AdminTicketUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No update fields provided",
        )

    for field, value in updates.items():
        setattr(ticket, field, value)

    try:
        db.commit()
        db.refresh(ticket)

    except Exception as e:
        db.rollback()
        print(f"Ticket update error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to update ticket",
        )

    return ticket


# ASSIGN / REASSIGN / UNASSIGN a ticket
@router.patch("/{ticket_id}/assignment", response_model=TicketResponse)
def assign_ticket(
    ticket_id: int,
    data: AdminTicketAssign,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    ticket = db.query(Ticket).filter(
        Ticket.id == ticket_id
    ).first()

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    # Validate that the assigned user exists
    if data.assigned_to is not None:
        assigned_user = db.query(User).filter(
            User.id == data.assigned_to
        ).first()

        if not assigned_user:
            raise HTTPException(
                status_code=404,
                detail="Assigned user not found",
            )

    # Save assignment (None means unassigned)
    ticket.assigned_to = data.assigned_to

    try:
        db.commit()
        db.refresh(ticket)

    except Exception as e:
        db.rollback()
        print(f"Ticket assignment error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to assign ticket",
        )

    return ticket
