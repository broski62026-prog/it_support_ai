from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.api.routes.auth import get_current_user

from app.schemas.conversation import (
    ConversationHistoryResponse,
    ConversationDetailResponse,
    MessageHistoryResponse,
)


router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversation History"],
)


# GET all conversations belonging to the logged-in employee
@router.get("/", response_model=list[ConversationHistoryResponse])
def get_my_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )

    result = []

    for conversation in conversations:
        result.append(
            {
                "id": conversation.id,
                "title": conversation.title,
                "status": conversation.status,
                "created_at": conversation.created_at,
                "message_count": len(conversation.messages),
            }
        )

    return result


# GET a conversation with its complete message history
@router.get(
    "/{conversation_id}",
    response_model=ConversationDetailResponse,
)
def get_conversation_history(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    ordered_messages = sorted(
        conversation.messages,
        key=lambda message: message.created_at,
    )

    return {
        "id": conversation.id,
        "title": conversation.title,
        "status": conversation.status,
        "created_at": conversation.created_at,
        "messages": [
            MessageHistoryResponse.model_validate(message)
            for message in ordered_messages
        ],
    }