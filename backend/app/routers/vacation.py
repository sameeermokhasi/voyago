from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
import random
import string
from datetime import datetime
from pydantic import BaseModel # Added

from app.database import get_db
from app.models import User, Vacation, UserRole, Transaction, LoyaltyPoints, RideStatus
from app.schemas import VacationCreate, VacationResponse
from app.auth import get_current_active_user
from app.routers.vacation_scheduler import schedule_next_ride
from app.utils import calculate_distance, calculate_fare
from app.services.ai_visualizer import visualizer # Added
from app.services.travel_buddy_agent import travel_buddy_agent # Added
import json

router = APIRouter()

class TravelBuddyRequestModel(BaseModel):
    city: str
    budget: float = 10000.0
    currency: str = "INR"
    travel_style: str = "explorer"

@router.post("/travel-buddy")
async def generate_vacation_travel_buddy(request: TravelBuddyRequestModel):
    """Travel Buddy Agent endpoint nested under /api/vacation/travel-buddy"""
    try:
        return travel_buddy_agent.execute(
            city=request.city,
            budget=request.budget,
            currency=request.currency,
            travel_style=request.travel_style or "explorer"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class VisualizeRequest(BaseModel):
    destination: str
    trip_type: str = "leisure"

@router.post("/visualize")
async def visualize_trip(request: VisualizeRequest):
    try:
        script = visualizer.generate_script(request.destination, request.trip_type)
        return {"script": script}
    except Exception as e:
        print(f"Visualization Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def generate_booking_reference() -> str:
    """Generate a unique booking reference"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

def calculate_vacation_price(
    days: int,
    passengers: int,
    vehicle_type: str,
    ride_included: bool,
    hotel_included: bool,
    is_fixed_package: bool = False,
    flight_details: str = None,
    activities: str = None
) -> float:
    """Calculate vacation package price based on estimated cab rides"""
    total_fare = 0.0
    
    # Default coordinates for estimation
    bangalore_lat = 12.9716
    bangalore_lng = 77.5946
    bangalore_airport_lat = 13.1986
    bangalore_airport_lng = 77.7066
    
    goa_airport_lat = 15.3808
    goa_airport_lng = 73.8380
    goa_hotel_lat = 15.2993
    goa_hotel_lng = 74.1240
    
    # 1. Home -> Airport (Bangalore)
    dist_home_airport = calculate_distance(bangalore_lat, bangalore_lng, bangalore_airport_lat, bangalore_airport_lng)
    fare_home_airport = calculate_fare(dist_home_airport, vehicle_type)
    total_fare += fare_home_airport
    
    # 2. Airport -> Hotel (Goa)
    dist_airport_hotel = calculate_distance(goa_airport_lat, goa_airport_lng, goa_hotel_lat, goa_hotel_lng)
    fare_airport_hotel = calculate_fare(dist_airport_hotel, vehicle_type)
    total_fare += fare_airport_hotel
    
    # 3. Activities (Hotel -> Activity)
    if activities:
        try:
            activities_list = json.loads(activities)
            for i, activity in enumerate(activities_list):
                # Simulate activity location with slight offset
                activity_lat = 15.3000 + (i * 0.01)
                activity_lng = 74.1250 + (i * 0.01)
                
                dist_activity = calculate_distance(goa_hotel_lat, goa_hotel_lng, activity_lat, activity_lng)
                fare_activity = calculate_fare(dist_activity, vehicle_type)
                total_fare += fare_activity
        except:
            pass
            
    # 4. Hotel -> Airport (Goa)
    # Same distance as Airport -> Hotel
    total_fare += fare_airport_hotel
    
    return round(total_fare, 2)

@router.post("/", response_model=VacationResponse, status_code=status.HTTP_201_CREATED)
async def create_vacation(
    vacation_data: VacationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a vacation booking"""
    # Fix the role comparison - use direct enum comparison or string fallback
    is_rider = False
    if current_user.role == UserRole.RIDER:
        is_rider = True
    elif hasattr(current_user.role, 'value') and current_user.role.value == UserRole.RIDER.value:
        is_rider = True
    elif str(current_user.role) == "rider" or str(current_user.role) == UserRole.RIDER.value:
        is_rider = True
        
    if not is_rider:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only riders can book vacations. Your role: {current_user.role}"
        )
    
    # Validate dates
    if vacation_data.end_date <= vacation_data.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    # Calculate number of days
    days = (vacation_data.end_date - vacation_data.start_date).days
    
    # Calculate total price
    if vacation_data.is_fixed_package and vacation_data.total_price:
        total_price = vacation_data.total_price
    else:
        total_price = calculate_vacation_price(
            days,
            vacation_data.passengers,
            vacation_data.vehicle_type.value,
            vacation_data.ride_included,
            vacation_data.hotel_included,
            vacation_data.is_fixed_package,
            vacation_data.flight_details,
            vacation_data.activities
        )
    
    # Generate booking reference
    booking_ref = generate_booking_reference()
    
    # Create vacation record
    initial_status = "pending"
    if not vacation_data.is_fixed_package:
        initial_status = "confirmed"
        
    new_vacation = Vacation(
        user_id=current_user.id,
        destination=vacation_data.destination,
        hotel_name=vacation_data.hotel_name,
        hotel_address=vacation_data.hotel_address,
        start_date=vacation_data.start_date,
        end_date=vacation_data.end_date,
        vehicle_type=vacation_data.vehicle_type,
        passengers=vacation_data.passengers,
        ride_included=vacation_data.ride_included,
        hotel_included=vacation_data.hotel_included,
        is_fixed_package=vacation_data.is_fixed_package,
        total_price=total_price,
        booking_reference=booking_ref,
        status=initial_status,
        # New fields for automated schedule-based trip planner
        schedule=vacation_data.schedule,
        flight_details=vacation_data.flight_details,
        activities=vacation_data.activities,
        meal_preferences=vacation_data.meal_preferences
    )
    
    try:
        db.add(new_vacation)
        db.commit()
        db.refresh(new_vacation)
        print(f"Vacation booking created successfully with ID: {new_vacation.id}")
    except Exception as e:
        db.rollback()
        print(f"Failed to create vacation booking: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vacation booking: {str(e)}"
        )
    
    # Add loyalty points
    try:
        loyalty = db.query(LoyaltyPoints).filter(LoyaltyPoints.user_id == current_user.id).first()
        if loyalty:
            points_earned = int(total_price / 100)  # 1 point per 100 currency
            loyalty.total_points = loyalty.total_points + points_earned
            
            # Update tier
            if loyalty.total_points >= 10000:
                loyalty.tier = "platinum"
            elif loyalty.total_points >= 5000:
                loyalty.tier = "gold"
            elif loyalty.total_points >= 1000:
                loyalty.tier = "silver"
            
            db.commit()
            print(f"Loyalty points updated. New total: {loyalty.total_points}")
    except Exception as e:
        print(f"Failed to update loyalty points: {e}")
        # Don't fail the booking if loyalty points can't be updated
        pass
    
    # Send WebSocket notification to nearby drivers
    # ONLY for fixed packages (custom packages are treated as local rides phase-by-phase)
    if vacation_data.is_fixed_package:
        try:
            from app.websocket import manager
            from app.routers.rides import find_nearby_drivers
            # For simplicity, we'll notify all available drivers
            # Get the user's location from their profile or first ride
            default_lat = 12.9716  # Bangalore
            default_lng = 77.5946
            
            # Try to get user's location from their profile or first ride
            drivers = db.query(User).join(DriverProfile).filter(
                and_(
                    User.role == UserRole.DRIVER,
                    User.is_active == True,
                    DriverProfile.is_available == True,
                    DriverProfile.current_lat != None,
                    DriverProfile.current_lng != None
                )
            ).all()
            
            print(f"Found {len(drivers)} available drivers to notify")
            
            # Send WebSocket notification to nearby drivers
            for driver in drivers:
                try:
                    await manager.send_personal_message({
                        "type": "new_vacation_request",
                        "vacation_id": new_vacation.id,
                        "destination": new_vacation.destination,
                        "hotel_name": new_vacation.hotel_name,
                        "start_date": new_vacation.start_date.isoformat(),
                        "end_date": new_vacation.end_date.isoformat(),
                        "total_price": float(new_vacation.total_price),
                        "passengers": new_vacation.passengers
                    }, int(driver.id) if driver.id is not None else 0)
                    print(f"Sent vacation request notification to driver {driver.id}")
                except Exception as e:
                    print(f"Failed to send WebSocket message to driver {driver.id}: {e}")
        except Exception as e:
            print(f"Failed to send WebSocket notifications: {e}")
            
    # For custom/automated packages, automatically schedule the first ride immediately
    # This specifically addresses the requirement: "the rider must get the button of START NEXT LEG not at the beginiinng itself"
    # By starting the first leg now, the rider will be in "Loop 1" (Ride 1), and "START NEXT LEG" will appear after this ride is done.
    if not vacation_data.is_fixed_package:
        try:
            print(f"Auto-scheduling first ride for custom vacation {new_vacation.id}...")
            # Import here to avoid circular dependency issues at top level if any
            from app.routers.vacation_scheduler import schedule_next_ride
            await schedule_next_ride(db, new_vacation.id)
            print(f"Successfully auto-scheduled first ride for vacation {new_vacation.id}")
        except Exception as e:
            print(f"Failed to auto-schedule first ride: {e}")
            # We don't fail the booking, but log the error. 
            # The user might need to click "Start Next Leg" manually if this fails, 
            # or we could rely on the "Start Next Leg" button being available since status is confirmed.
            
    return new_vacation

@router.get("/", response_model=List[VacationResponse])
async def get_vacations(
    status: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's vacation bookings"""
    query = db.query(Vacation)
    
    if status:
        query = query.filter(Vacation.status == status)
    
    if current_user.role == UserRole.ADMIN:
        pass  # Admin sees all
    elif current_user.role == UserRole.DRIVER:
        # Drivers see pending bookings for confirmation AND their assigned bookings
        if not status:  # If no status specified, show pending for drivers
            query = query.filter(
                (Vacation.status == "pending") | 
                (Vacation.driver_id == current_user.id)
            )
        else:
            # If status is specified, also check if it's assigned to them (unless it's pending which is open to all)
            if status == "pending":
                query = query.filter(Vacation.status == "pending")
            else:
                query = query.filter(
                    and_(
                        Vacation.status == status,
                        Vacation.driver_id == current_user.id
                    )
                )
    else:
        # Regular users see their own bookings
        query = query.filter(Vacation.user_id == current_user.id)
    
    vacations = query.order_by(Vacation.created_at.desc()).all()
    print(f"DEBUG: Found {len(vacations)} vacations for user {current_user.email}")
    for v in vacations:
        try:
            print(f"DEBUG: Vacation {v.id}: rides={len(v.rides)}, completed={v.completed_rides_count}, active={v.has_active_ride}")
        except Exception as e:
            print(f"ERROR processing vacation {v.id}: {e}")
    return vacations

@router.get("/available", response_model=List[VacationResponse])
async def get_available_vacations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get available vacation bookings for drivers"""
    # Allow both DRIVER and ADMIN to view available vacations
    is_authorized = False
    if current_user.role == UserRole.DRIVER or current_user.role == UserRole.ADMIN:
        is_authorized = True
    elif hasattr(current_user.role, 'value') and (current_user.role.value == UserRole.DRIVER.value or current_user.role.value == UserRole.ADMIN.value):
        is_authorized = True
    elif str(current_user.role) == "driver" or str(current_user.role) == "admin":
        is_authorized = True
        
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can view available vacation bookings"
        )
    
    vacations = db.query(Vacation).filter(
        Vacation.status == "pending"
    ).order_by(Vacation.created_at.desc()).all()
    
    return vacations

@router.get("/{vacation_id}", response_model=VacationResponse)
async def get_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific vacation booking"""
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
    
    if current_user.role != UserRole.ADMIN and vacation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this booking"
        )
    
    return vacation

@router.delete("/{vacation_id}")
async def cancel_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a vacation booking"""
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
    
    if vacation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to cancel this booking"
        )
    
    print(f"DEBUG: Attempting to cancel vacation {vacation_id} for user {current_user.id}")
    
    if vacation.status == "completed":
        print(f"DEBUG: Cannot cancel completed vacation {vacation_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed vacations"
        )
    
    try:
        vacation.status = "cancelled"
        
        # Cancel all associated pending/active rides
        print(f"DEBUG: Cancelling {len(vacation.rides)} associated rides")
        for ride in vacation.rides:
            if ride.status not in [RideStatus.COMPLETED, RideStatus.CANCELLED]:
                print(f"DEBUG: Cancelling ride {ride.id} with status {ride.status}")
                ride.status = RideStatus.CANCELLED
                
        db.commit()
        print(f"DEBUG: Vacation {vacation_id} cancelled successfully")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to cancel vacation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel vacation: {str(e)}"
        )
    
    return {"message": "Vacation booking cancelled successfully"}

@router.patch("/{vacation_id}/confirm")
async def confirm_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Confirm a vacation booking (driver action)"""
    # Debug logging
    print(f"DEBUG: confirm_vacation user={current_user.email}, role={current_user.role}, type={type(current_user.role)}")
    
    # Check if user is driver or admin
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()
        
    print(f"DEBUG: confirm_vacation user={current_user.email}, role={user_role}")
    
    # Check if user is driver or admin
    if user_role not in [UserRole.DRIVER.value, UserRole.ADMIN.value]:
        print(f"DEBUG: Authorization failed for user {current_user.id} with role {user_role}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only drivers and admins can confirm vacation bookings. Your role is: {user_role}"
        )
    
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
    
    if vacation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacation booking is not in pending status"
        )
    
    vacation.status = "confirmed"
    vacation.driver_id = current_user.id  # Assign driver
    db.commit()
    db.refresh(vacation)
    
    # Schedule the first ride
    print(f"Vacation {vacation.id} confirmed. Scheduling first ride...")
    await schedule_next_ride(db, vacation.id)
    
    # Send WebSocket notification to rider
    try:
        from app.websocket import manager
        await manager.send_personal_message({
            "type": "vacation_status_update",
            "vacation_id": vacation.id,
            "status": "confirmed"
        }, int(vacation.user_id) if vacation.user_id is not None else 0)
    except Exception as e:
        print(f"Failed to send WebSocket notification to rider: {e}")
    
    return {"message": "Vacation booking confirmed successfully", "vacation": vacation}

@router.patch("/{vacation_id}/reject")
async def reject_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Reject a vacation booking (driver action)"""
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()

    # Only drivers and admins can reject bookings
    if user_role not in [UserRole.DRIVER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers and admins can reject vacation bookings"
        )
    
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
    
    if vacation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacation booking is not in pending status"
        )
    
    # Set status to rejected
    vacation.status = "rejected"
    db.commit()
    db.refresh(vacation)
    
    # Send WebSocket notification to rider
    try:
        from app.websocket import manager
        await manager.send_personal_message({
            "type": "vacation_status_update",
            "vacation_id": vacation.id,
            "status": "rejected"
        }, int(vacation.user_id) if vacation.user_id is not None else 0)
    except Exception as e:
        print(f"Failed to send WebSocket notification to rider: {e}")
    
    return {"message": "Vacation booking rejected successfully", "vacation": vacation}

@router.patch("/{vacation_id}/start")
async def start_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a vacation (driver action)"""
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()

    # Check if user is driver
    if user_role != UserRole.DRIVER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only drivers can start vacations. Your role: {user_role}"
        )
    
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
        
    if vacation.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the assigned driver for this vacation"
        )
    
    if vacation.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacation must be confirmed before starting"
        )
    
    vacation.status = "in_progress"
    db.commit()
    db.refresh(vacation)
    
    # Send WebSocket notification to rider
    try:
        from app.websocket import manager
        await manager.send_personal_message({
            "type": "vacation_status_update",
            "vacation_id": vacation.id,
            "status": "in_progress"
        }, int(vacation.user_id) if vacation.user_id is not None else 0)
    except Exception as e:
        print(f"Failed to send WebSocket notification to rider: {e}")
        
    return {"message": "Vacation started successfully", "vacation": vacation}

@router.patch("/{vacation_id}/complete")
async def complete_vacation(
    vacation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete a vacation (driver action)"""
    # Robust role check
    user_role = current_user.role
    if hasattr(user_role, 'value'):
        user_role = user_role.value
    else:
        user_role = str(user_role).lower()

    # Check if user is driver
    if user_role != UserRole.DRIVER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only drivers can complete vacations. Your role: {user_role}"
        )
    
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
        
    if vacation.driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not the assigned driver for this vacation"
        )
    
    if vacation.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vacation must be in progress before completing"
        )
    
    vacation.status = "completed"
    
    # Credit driver's wallet
    driver = db.query(User).filter(User.id == current_user.id).first()
    if driver:
        driver.wallet_balance = float(driver.wallet_balance or 0) + vacation.total_price
        
        # Create transaction record
        transaction = Transaction(
            user_id=driver.id,
            amount=vacation.total_price,
            type="credit",
            description=f"Payment for vacation booking #{vacation.id} ({vacation.destination})"
        )
        db.add(transaction)
        
    db.commit()
    db.refresh(vacation)
    
    # Send WebSocket notification to rider
    try:
        from app.websocket import manager
        await manager.send_personal_message({
            "type": "vacation_status_update",
            "vacation_id": vacation.id,
            "status": "completed"
        }, int(vacation.user_id) if vacation.user_id is not None else 0)
    except Exception as e:
        print(f"Failed to send WebSocket notification to rider: {e}")
        
    return {"message": "Vacation completed successfully", "vacation": vacation}

@router.get("/loyalty/points")
async def get_loyalty_points(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's loyalty points"""
    try:
        loyalty = db.query(LoyaltyPoints).filter(LoyaltyPoints.user_id == current_user.id).first()
        
        if not loyalty:
            return {
                "total_points": 0,
                "tier": "bronze",
                "message": "No loyalty points yet"
            }
        
        return {
            "total_points": loyalty.total_points,
            "tier": loyalty.tier,
            "benefits": {
                "bronze": "Basic rewards",
                "silver": "5% discount on rides",
                "gold": "10% discount + priority booking",
                "platinum": "15% discount + free upgrades"
            }.get(loyalty.tier, "Basic rewards")
        }
    except Exception as e:
        print(f"Error in get_loyalty_points: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Server Error: {str(e)}"
        )
@router.patch("/{vacation_id}")
async def update_vacation(
    vacation_id: int,
    vacation_data: VacationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a vacation booking"""
    vacation = db.query(Vacation).filter(Vacation.id == vacation_id).first()
    
    if not vacation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vacation booking not found"
        )
    
    if vacation.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this booking"
        )
    
    # We only allow updating if it's not completed/cancelled
    if vacation.status in ["completed", "cancelled"]:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update vacation in {vacation.status} status"
        )

    # Update fields
    if vacation_data.activities:
        vacation.activities = vacation_data.activities
    if vacation_data.schedule:
        vacation.schedule = vacation_data.schedule
    if vacation_data.flight_details:
        vacation.flight_details = vacation_data.flight_details
    if vacation_data.meal_preferences:
        vacation.meal_preferences = vacation_data.meal_preferences
        
    db.commit()
    db.refresh(vacation)
    return vacation
