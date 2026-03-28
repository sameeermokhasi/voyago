from app.database import SessionLocal
from app.models import User, UserRole

def check_admins():
    db = SessionLocal()
    try:
        admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
        print(f"Found {len(admins)} admins.")
        for admin in admins:
            print(f"ID: {admin.id}, Name: {admin.name}, Email: {admin.email}, Active: {admin.is_active}")
            
        if not admins:
            print("No admin users found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_admins()
