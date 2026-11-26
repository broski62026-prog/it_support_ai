from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.routes.auth import get_current_user
from app.core.security import hash_password
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import AdminUserCreate, UserResponse, UserStatusUpdate


router = APIRouter(prefix="/api/admin/users", tags=["Admin User Management"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id).all()


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(
    data: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    existing_user = db.query(User).filter(
        (User.username == data.username) | (User.email == str(data.email))
    ).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Username or email already registered")

    user = User(
        username=data.username,
        email=str(data.email),
        hashed_password=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
):
    if user_id == current_admin.id and not data.is_active:
        raise HTTPException(status_code=400, detail="You cannot disable your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user
