from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

db = Database()


async def connect_to_mongo():
    """Create database connection"""
    try:
        if not settings.DATABASE_URL:
            logger.warning("DATABASE_URL not set. Database features will be disabled.")
            return
        
        db.client = AsyncIOMotorClient(settings.DATABASE_URL)
        # Extract database name from URL or use default
        db_name = settings.DATABASE_URL.split("/")[-1].split("?")[0]
        db.database = db.client[db_name]
        
        # Test connection
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        db.client = None
        db.database = None


async def close_mongo_connection():
    """Close database connection"""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")


async def save_evaluation(evaluation_data: dict):
    """Save evaluation result to database"""
    if not db.database:
        logger.warning("Database not connected. Skipping save.")
        return None
    
    try:
        collection = db.database["evaluations"]
        result = await collection.insert_one(evaluation_data)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error saving evaluation: {e}")
        return None


async def get_evaluation(evaluation_id: str):
    """Get evaluation by ID"""
    if not db.database:
        return None
    
    try:
        from bson import ObjectId
        collection = db.database["evaluations"]
        result = await collection.find_one({"_id": ObjectId(evaluation_id)})
        if result:
            result["_id"] = str(result["_id"])
        return result
    except Exception as e:
        logger.error(f"Error getting evaluation: {e}")
        return None


async def get_evaluations(limit: int = 10, skip: int = 0):
    """Get recent evaluations"""
    if not db.database:
        return []
    
    try:
        collection = db.database["evaluations"]
        cursor = collection.find().sort("timestamp", -1).skip(skip).limit(limit)
        results = await cursor.to_list(length=limit)
        for result in results:
            result["_id"] = str(result["_id"])
        return results
    except Exception as e:
        logger.error(f"Error getting evaluations: {e}")
        return []


