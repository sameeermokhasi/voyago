from datetime import datetime, timedelta, timezone
import random
import requests as req
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, DriverProfile, LoyaltyPoints
from app.schemas import UserCreate, UserResponse, Token, DriverProfileCreate, OTPVerify, EmailOTP, VerifyEmailOTP
from pydantic import BaseModel
from app.auth import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (rider, driver, or admin)"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    # Generate OTP
    otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
    # In production, send this via SMS. For now, print to console.
    print(f"\n{'='*50}\nOTP FOR {user_data.email}: {otp}\n{'='*50}\n")
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password=hashed_password,
        role=user_data.role,
        is_active=False, # Wait for verification
        otp_code=otp,
        otp_expiry=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create loyalty points for riders
    if new_user.role == UserRole.RIDER:
        loyalty = LoyaltyPoints(user_id=new_user.id)
        db.add(loyalty)
    
    # Create driver profile for drivers
    if new_user.role == UserRole.DRIVER:
        # Generate a default license number
        license_number = f"LIC{new_user.id:06d}"
        driver_profile = DriverProfile(
            user_id=new_user.id,
            license_number=license_number,
            is_available=False  # Default to offline until they toggle availability
        )
        db.add(driver_profile)
    
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login endpoint"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/driver/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_driver(
    user_data: UserCreate,
    driver_data: DriverProfileCreate,
    db: Session = Depends(get_db)
):
    """Register a new driver with profile"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if license number already exists
    existing_license = db.query(DriverProfile).filter(
        DriverProfile.license_number == driver_data.license_number
    ).first()
    if existing_license:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="License number already registered"
        )
    
    # Create new driver user
    hashed_password = get_password_hash(user_data.password)
    
    # Generate OTP
    otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
    print(f"\n{'='*50}\nOTP FOR {user_data.email}: {otp}\n{'='*50}\n")
    
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password=hashed_password,
        role=UserRole.DRIVER,
        is_active=False,
        otp_code=otp,
        otp_expiry=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create driver profile
    new_driver_profile = DriverProfile(
        user_id=new_user.id,
        license_number=driver_data.license_number,
        vehicle_type=driver_data.vehicle_type,
        vehicle_model=driver_data.vehicle_model,
        vehicle_plate=driver_data.vehicle_plate,

        vehicle_color=driver_data.vehicle_color,
        city=driver_data.city
    )
    
    db.add(new_driver_profile)
    db.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/verify-otp", response_model=Token)
async def verify_otp(verify_data: OTPVerify, db: Session = Depends(get_db)):
    """Verify OTP and activate account"""
    user = db.query(User).filter(User.email == verify_data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.is_active:
         # Already active, just return token
         access_token = create_access_token(data={"sub": user.email})
         return {
             "access_token": access_token,
             "token_type": "bearer",
             "user": user
         }
        
    if not user.otp_code or not user.otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP verification pending"
        )
        
    # Check expiry
    # Ensure both are offset-aware or both offset-naive. 
    # SQLAlchemy might return naive datetime. If so, assume UTC.
    if user.otp_expiry.tzinfo is None:
        user.otp_expiry = user.otp_expiry.replace(tzinfo=timezone.utc)
        
    if datetime.now(timezone.utc) > user.otp_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
        
    if verify_data.otp != user.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
        
    # Activate user
    user.is_active = True
    user.otp_code = None
    user.otp_expiry = None
    user.is_verified = True # Mark verified as well
    db.commit()
    db.refresh(user)
    
    # Return access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }



# In-memory OTP storage for demo purposes
# In production, use Redis or Database with expiration
email_otp_storage = {}

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

@router.post("/send-email-otp")
def send_email_otp(data: EmailOTP):
    """Generate and send an OTP to the email"""
    # Generate 6-digit OTP
    otp = "".join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP
    email_otp_storage[data.email] = otp
    
    print(f"============================================")
    print(f"📧 EMAIL OTP for {data.email}: {otp}")
    print(f"============================================")
    
    # Try sending via SMTP if credentials exist
    if settings.email_username and settings.email_password:
        try:
            msg = MIMEMultipart()
            msg['From'] = settings.email_from
            msg['To'] = data.email
            msg['Subject'] = "Your Voyago Verification Code"
            
            body = f"""
            <html>
                <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #3b82f6;">Verify Your Email</h2>
                    <p>Your OTP code is:</p>
                    <h1 style="background-color: #f3f4f6; padding: 10px; display: inline-block; border-radius: 8px;">{otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                </body>
            </html>
            """
            msg.attach(MIMEText(body, 'html'))
            
            with smtplib.SMTP(settings.email_host, settings.email_port) as server:
                server.starttls()
                server.login(settings.email_username, settings.email_password)
                server.send_message(msg)
                
            print(f"INFO: OTP email sent to {data.email}")
            return {"message": f"OTP sent to {data.email}"} 
            
        except Exception as e:
            print(f"SMTP Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to send OTP email")
    
    print("ERROR: SMTP Credentials missing")
    raise HTTPException(status_code=500, detail="Email service not configured")

@router.post("/verify-email-otp")
def verify_email_otp(data: VerifyEmailOTP):
    """Verify the submitted OTP"""
    stored_otp = email_otp_storage.get(data.email)
    
    if not stored_otp:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")
        
    if stored_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    # Clear OTP after successful verification
    del email_otp_storage[data.email]
    
    return {"message": "Email verified successfully"}
