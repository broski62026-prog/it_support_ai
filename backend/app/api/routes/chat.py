
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.api.routes.auth import get_current_user
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai_service import generate_it_response
from app.services.knowledge_service import search_knowledge
from app.schemas.feedback import ResolutionFeedback
from app.services.verified_knowledge_service import save_verified_solution
from app.services.ticket_service import create_support_ticket


router = APIRouter(prefix="/api/chat", tags=["IT Support Chat"])


# Start a new conversation or continue an existing one
@router.post("", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Get existing conversation or create a new one
    if data.conversation_id is not None:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == data.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found",
            )

    else:
        conversation = Conversation(
            user_id=current_user.id,
            title=data.message[:80],
            status="active",
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 2. Save employee message
    user_message = Message(
        conversation_id=conversation.id,
        sender="user",
        content=data.message,
    )

    db.add(user_message)
    db.commit()

    # 3. Search verified knowledge first
    ai_reply = None
    response_source = "groq"

    try:
        knowledge_result = search_knowledge(db, data.message)

        if knowledge_result:
            ai_reply = knowledge_result["solution"]
            response_source = "knowledge_base"
            print("Verified knowledge solution found.")

    except Exception as e:
        print(f"Knowledge search error: {e}")
        print("Falling back to Groq.")

    # 4. If no verified solution is found, call Groq
    if ai_reply is None:
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation.id)
            .order_by(Message.id.desc())
            .limit(12)
            .all()
        )

        recent_messages.reverse()

        chat_history = [
            {"role": message.sender, "content": message.content}
            for message in recent_messages
        ]

        try:
            ai_reply = await generate_it_response(chat_history)

        except Exception as e:
            print(f"Groq API error: {e}")

            raise HTTPException(
                status_code=502,
                detail="AI support is temporarily unavailable. Please try again.",
            )

    # 5. Save assistant response
    assistant_message = Message(
        conversation_id=conversation.id,
        sender="assistant",
        content=ai_reply,
    )

    db.add(assistant_message)
    db.commit()

    # 6. Return response
    return ChatResponse(
        conversation_id=conversation.id,
        reply=ai_reply,
        source=response_source,
    )


# Submit feedback for a conversation
@router.post("/{conversation_id}/feedback")
def submit_feedback(
    conversation_id: int,
    data: ResolutionFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Verify conversation ownership
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

    # 2. Get the latest AI response
    assistant_message = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender == "assistant",
        )
        .order_by(Message.id.desc())
        .first()
    )

    if not assistant_message:
        raise HTTPException(
            status_code=400,
            detail="No assistant response found for this conversation",
        )

    # 3. Get the user question before the latest AI response
    user_message = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender == "user",
            Message.id < assistant_message.id,
        )
        .order_by(Message.id.desc())
        .first()
    )

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="No user question found for this response",
        )

    # 4. If resolved, save verified solution
    if data.resolved:
        try:
            save_verified_solution(
                db=db,
                issue_description=user_message.content,
                solution=assistant_message.content,
            )

        except Exception as e:
            db.rollback()
            print(f"Knowledge saving error: {e}")

            raise HTTPException(
                status_code=500,
                detail="Failed to save verified solution",
            )

        return {
            "message": "Thank you! The solution has been saved as verified knowledge.",
            "verified": True,
        }

    # 5. If unresolved, create IT support ticket
    try:
        ticket = create_support_ticket(
            db=db,
            user_id=current_user.id,
            conversation_id=conversation_id,
            issue_description=user_message.content,
        )

    except Exception as e:
        db.rollback()
        print(f"Ticket creation error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to create support ticket",
        )

    return {
        "message": "Your issue was not resolved. An IT support ticket has been created.",
        "verified": False,
    "ticket_id": ticket.id,
    }
