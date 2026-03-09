from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure 
from app.core.config import settings

MONGO_URL = settings.MONGO_URI 

client = AsyncIOMotorClient(MONGO_URL)
db = client[settings.DB_NAME or "airo_db"]  # FIX: was hardcoded as 'userdb'

async def get_db():
    return db
