from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import User, Ride, DriverProfile, UserRole, RideStatus
from app.schemas import AdminStats, UserResponse
from app.auth import get_current_active_user

router = APIRouter()

async def verify_admin(current_user: User = Depends(get_current_active_user)):
    """Verify user is an admin"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    total_users = db.query(User).count()
    total_drivers = db.query(User).filter(User.role == UserRole.DRIVER).count()
    total_riders = db.query(User).filter(User.role == UserRole.RIDER).count()
    total_rides = db.query(Ride).count()
    active_rides = db.query(Ride).filter(
        Ride.status.in_([RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.IN_PROGRESS])
    ).count()
    completed_rides = db.query(Ride).filter(Ride.status == RideStatus.COMPLETED).count()
    
    # Calculate Platform Revenue (Admin Wallet Balance or Sum of Platform Fees)
    # Method 1: Get Admin User Wallet Balance (Most Accurate based on new rides.py logic)
    admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
    total_revenue = float(admin_user.wallet_balance) if admin_user and admin_user.wallet_balance else 0.0
    
    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "total_riders": total_riders,
        "total_rides": total_rides,
        "active_rides": active_rides,
        "completed_rides": completed_rides,
        "total_revenue": float(total_revenue)
    }

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db),
    role: str = None
):
    """Get all users"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    return users

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Toggle user active status"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = not user.is_active
    db.commit()
    
    return {
        "user_id": user.id,
        "is_active": user.is_active,
        "message": f"User {'activated' if user.is_active else 'deactivated'} successfully"
    }

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Delete a user"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# --- SEEDING ENDPOINT (FOR DEV ONLY) ---
from app.auth import get_password_hash
@router.post("/seed")
async def seed_database(
    secret: str,
    db: Session = Depends(get_db)
):
    """Seed the database with test users (Drivers & Riders)"""
    if secret != "voyago_rocks_2024":
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    created_users = []
    
    # --- Create Test Drivers ---
    test_drivers = [
        {"name": "Driver One", "email": "driver1@example.com", "phone": "9999999901", "city": "Mumbai"},
        {"name": "Driver Two", "email": "driver2@example.com", "phone": "9999999902", "city": "Pune"},
        {"name": "Driver Four", "email": "driver4@example.com", "phone": "9999999904", "city": "Goa"}, # The requested user
        {"name": "Driver Five", "email": "driver5@example.com", "phone": "9999999905", "city": "Bangalore"},
    ]
    
    password_hash = get_password_hash("driver123")
    
    for i, d in enumerate(test_drivers):
        existing = db.query(User).filter(User.email == d["email"]).first()
        if not existing:
            # Create User
            new_user = User(
                name=d["name"],
                email=d["email"],
                phone=d["phone"],
                password=password_hash,
                role=UserRole.DRIVER,
                is_active=True,
                is_verified=True,
                wallet_balance=500.0,
                address=f"123 Street, {d['city']}"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            # Create Profile
            profile = DriverProfile(
                user_id=new_user.id,
                license_number=f"TESTLIC{new_user.id}",
                vehicle_type=VehicleType.ECONOMY if i % 2 == 0 else VehicleType.SUV,
                vehicle_model="Toyota Prius" if i % 2 == 0 else "Mahindra XUV",
                vehicle_plate=f"MH{i+12} AB {1000+i}",
                city=d["city"],
                is_available=True,
                total_rides=random.randint(5, 50),
                rating=round(random.uniform(4.0, 5.0), 1)
            )
            db.add(profile)
            db.commit()
            created_users.append(d["email"])

    # --- Create Test Riders ---
    test_riders = [
        {"name": "Rider One", "email": "rider1@example.com"},
        {"name": "Rider Two", "email": "rider2@example.com"},
    ]
    
    for r in test_riders:
        existing = db.query(User).filter(User.email == r["email"]).first()
        if not existing:
            new_rider = User(
                name=r["name"],
                email=r["email"],
                password=password_hash, # same password
                role=UserRole.RIDER,
                is_active=True,
                is_verified=True,
                wallet_balance=1000.0
            )
            db.add(new_rider)
            db.commit()
            created_users.append(r["email"])
    
    return {
        "message": f"Database seeded successfully. Created {len(created_users)} users.",
        "users": created_users,
        "password": "driver123"
    }
