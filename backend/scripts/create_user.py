import asyncio
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.hash import hash_password
from datetime import datetime

async def main():
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "airo_db")
    client = AsyncIOMotorClient(uri)
    db = client[db_name]
    
    # Check if user exists
    user = await db.users.find_one({"email": "test@example.com"})
    if not user:
        user_doc = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("password123"),
            "education": [],
            "skills": [],
            "projects": [],
            "experience": [],
            "certifications": [],
            "links": {},
            "achievements": [],
            "profile_score": 0,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        await db.users.insert_one(user_doc)
        print("Test user created: email 'test@example.com', password 'password123'")
    else:
        print("Test user already exists: email 'test@example.com'")

if __name__ == "__main__":
    asyncio.run(main())
