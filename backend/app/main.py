
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.chat import router as chat_router
from app.api.routes.tickets import router as tickets_router
from app.api.routes.admin_tickets import router as admin_tickets_router
from app.api.routes.conversations import router as conversations_router
from app.api.routes.admin_users import router as admin_users_router


app = FastAPI(
    title="IT Support AI Agent",
    description="AI-powered IT troubleshooting for Windows, macOS, and Linux",
    version="1.0.0",
)

# Allow the React frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=(
        r"https?://(?:localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})"
        r"(?::\d+)?"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(tickets_router)
app.include_router(admin_tickets_router)
app.include_router(conversations_router)
app.include_router(admin_users_router)


@app.get("/")
def home():
    return {"message": "IT Support AI Agent API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
