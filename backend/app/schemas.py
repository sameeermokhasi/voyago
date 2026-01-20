from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, RideStatus, VehicleType

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.RIDER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str



class EmailOTP(BaseModel):
    email: EmailStr

class VerifyEmailOTP(BaseModel):
    email: EmailStr
    otp: str

# Driver Profile Schemas
class DriverProfileCreate(BaseModel):
    license_number: str
    vehicle_type: VehicleType = VehicleType.ECONOMY
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    city: str

class DriverProfileUpdate(BaseModel):
    vehicle_type: Optional[VehicleType] = None
    vehicle_model: Optional[str] = None
    vehicle_plate: Optional[str] = None
    vehicle_color: Optional[str] = None
    license_number: Optional[str] = None
    aadhar_card_number: Optional[str] = None
    city: Optional[str] = None

class DriverProfileResponse(BaseModel):
    id: int
    user_id: int
    license_number: str
    aadhar_card_number: Optional[str] = None
    vehicle_type: VehicleType
    vehicle_model: Optional[str]
    vehicle_plate: Optional[str]

    vehicle_color: Optional[str]
    city: Optional[str]
    rating: float
    total_rides: int
    is_available: bool
    current_lat: Optional[float]
    current_lng: Optional[float]
    
    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    is_verified: bool
    profile_picture: Optional[str] = None
    wallet_balance: float = 0.0
    address: Optional[str] = None
    created_at: datetime
    driver_profile: Optional[DriverProfileResponse] = None
    
    class Config:
        from_attributes = True

class DriverWithProfile(UserResponse):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class WalletAdd(BaseModel):
    amount: float = Field(gt=0, le=1000)

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    amount: float
    type: str
    description: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Ride Schemas
class RideCreate(BaseModel):
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    vehicle_type: VehicleType = VehicleType.ECONOMY
    scheduled_time: Optional[datetime] = None

class RideResponse(BaseModel):
    id: int
    rider_id: int
    driver_id: Optional[int]
    vacation_id: Optional[int] = None
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    destination_lat: float
    destination_lng: float
    status: RideStatus
    vehicle_type: VehicleType
    distance_km: Optional[float]
    duration_minutes: Optional[int]
    estimated_fare: Optional[float]
    final_fare: Optional[float]
    rating: Optional[int]
    feedback: Optional[str] = None
    scheduled_time: Optional[datetime]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    
    # Nested objects for frontend display
    rider: Optional[UserResponse] = None
    driver: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class RideUpdate(BaseModel):
    status: Optional[RideStatus] = None
    driver_id: Optional[int] = None
    final_fare: Optional[float] = None

class RideRating(BaseModel):
    rating: int = Field(ge=1, le=5)
    feedback: Optional[str] = None

# Location Update Schema
class LocationUpdate(BaseModel):
    lat: float
    lng: float

# Intercity Ride Schemas
class IntercityRideCreate(BaseModel):
    origin_city_id: int
    destination_city_id: int
    pickup_address: str
    dropoff_address: str
    scheduled_date: datetime
    vehicle_type: VehicleType = VehicleType.ECONOMY
    passengers: int = 1

class IntercityRideResponse(BaseModel):
    id: int
    rider_id: int
    driver_id: Optional[int]
    origin_city_id: int
    destination_city_id: int
    pickup_address: str
    dropoff_address: str
    scheduled_date: datetime
    status: RideStatus
    vehicle_type: VehicleType
    distance_km: Optional[float]
    estimated_duration_hours: Optional[float]
    price: float
    passengers: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# City Schemas
class CityCreate(BaseModel):
    name: str
    state: Optional[str] = None
    country: str = "India"
    lat: Optional[float] = None
    lng: Optional[float] = None

class CityResponse(BaseModel):
    id: int
    name: str
    state: Optional[str]
    country: str
    lat: Optional[float]
    lng: Optional[float]
    is_active: bool
    
    class Config:
        from_attributes = True

# Vacation Schemas
class VacationCreate(BaseModel):
    destination: str
    hotel_name: Optional[str] = None
    hotel_address: Optional[str] = None
    start_date: datetime
    end_date: datetime
    vehicle_type: VehicleType = VehicleType.ECONOMY
    passengers: int = 1
    ride_included: bool = True
    hotel_included: bool = True
    is_fixed_package: bool = False
    total_price: Optional[float] = None
    # New fields for automated schedule-based trip planner
    schedule: Optional[str] = None  # JSON string containing the full trip schedule
    flight_details: Optional[str] = None  # JSON string containing flight/train details
    activities: Optional[str] = None  # JSON string containing activities schedule
    meal_preferences: Optional[str] = None  # JSON string containing meal timings

class VacationResponse(BaseModel):
    id: int
    user_id: int
    destination: str
    hotel_name: Optional[str]
    hotel_address: Optional[str]
    start_date: datetime
    end_date: datetime
    total_price: float
    ride_included: bool
    hotel_included: bool
    is_fixed_package: bool
    vehicle_type: VehicleType
    passengers: int
    status: str
    booking_reference: Optional[str]
    created_at: datetime
    # New fields for automated schedule-based trip planner
    schedule: Optional[str] = None  # JSON string containing the full trip schedule
    flight_details: Optional[str] = None  # JSON string containing flight/train details
    activities: Optional[str] = None  # JSON string containing activities schedule
    meal_preferences: Optional[str] = None  # JSON string containing meal timings
    completed_rides_count: int = 0  # Number of completed rides for this vacation
    has_active_ride: bool = False  # Whether there is currently an active ride
    
    # Nested object
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Admin Schemas
class AdminStats(BaseModel):
    total_users: int
    total_drivers: int
    total_riders: int
    total_rides: int
    active_rides: int
    completed_rides: int
    total_revenue: float

# Saved Card Schemas
class SavedCardCreate(BaseModel):
    last4: str = Field(min_length=4, max_length=4)
    brand: str
    expiry_month: str
    expiry_year: str
    holder_name: str

class SavedCardResponse(SavedCardCreate):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
