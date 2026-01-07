from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.database import engine, Base, get_db
from app.models import User, UserRole
from app.routers import auth, rides, users, admin, vacation, vacation_scheduler, messages
from app.websocket import manager
from app.auth import decode_access_token, get_current_active_user
from sqlalchemy.orm import Session

print("--- LOADING MAIN.PY v2 (PING INCLUDED) ---")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- LIFESPAN STARTUP ---")
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        print("--- DATABASE TABLES CREATED ---")
    except Exception as e:
        print(f"--- DB ERROR: {e} ---")
    yield
    # Shutdown
    print("--- SHUTDOWN ---")

app = FastAPI(
    title="Uber Clone API",
    description="Comprehensive ride-hailing and vacation platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - Updated to allow all frontend ports
app.add_middleware(
    CORSMiddleware,
    # allow_origins=[...], # Commented out for debug
    allow_origins=["*"], # Allow ALL origins
    allow_credentials=False, # Must be False when using "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"--- REQUEST: {request.method} {request.url.path} ---")
    response = await call_next(request)
    print(f"--- RESPONSE: {response.status_code} ---")
    return response

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(rides.router, prefix="/api/rides", tags=["Rides"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(vacation.router, prefix="/api/vacation", tags=["Vacation"])
app.include_router(vacation_scheduler.router, prefix="/api/scheduler", tags=["Vacation Scheduler"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])

@app.get("/ping")
async def ping():
    return "pong"

@app.get("/")
async def root():
    return {
        "message": "Uber Clone API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/test-db")
async def test_db(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    try:
        # Test database connection by querying a simple table
        count = db.query(User).count()
        return {"status": "Database connection successful", "user_count": count}
    except Exception as e:
        return {"status": "Database connection failed", "error": str(e)}

@app.get("/test-user-role/{user_id}")
async def test_user_role(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}
    
    return {
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "is_driver": user.role == UserRole.DRIVER
    }

@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    # Decode token to get user info
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=1008)
        return
    
    user_email = payload.get("sub")
    if not user_email:
        await websocket.close(code=1008)
        return
    
    # Get actual user from database
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        await websocket.close(code=1008)
        return
    
    user_id = user.id
    
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                # Attempt to parse json
                import json
                msg_data = json.loads(data)
                
                if msg_data.get("type") == "SAFETY_ALERT":
                    # Broadcast critical alerts to all connected clients (Riders)
                    await manager.broadcast(msg_data)
                else:
                    # Echo back for testing or other messages
                    await manager.send_personal_message(
                        {"type": "message", "data": data},
                        user_id
                    )
            except Exception:
                # If not JSON or error, just echo
                await manager.send_personal_message(
                        {"type": "message", "data": data},
                        user_id
                    )
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
async def catch_all(request: Request, path_name: str):
    print(f"--- CATCH ALL HIT: {request.method} {path_name} ---")
    return {"status": "404", "message": "Path matched catch-all", "path": path_name}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)