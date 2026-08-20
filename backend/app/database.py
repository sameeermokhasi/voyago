from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Handle Render / Supabase postgres:// URL format for newer SQLAlchemy
sqlalchemy_database_url = (settings.database_url or "").strip()
if sqlalchemy_database_url.startswith("postgres://"):
    sqlalchemy_database_url = sqlalchemy_database_url.replace("postgres://", "postgresql://", 1)

if sqlalchemy_database_url and sqlalchemy_database_url.startswith("sqlite"):
    engine = create_engine(
        sqlalchemy_database_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        sqlalchemy_database_url,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
