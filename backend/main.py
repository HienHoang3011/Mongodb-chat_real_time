from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional, Union, List
import os
import json
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
from bson import json_util

# Load environment variables
load_dotenv()

app = FastAPI(title="MongoDB Query API", description="API to execute MongoDB queries from frontend.")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MongoDB Client
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://HienHoang:triplehptit2005@cluster0.mkefqur.mongodb.net/")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
except Exception as e:
    client = None
    print(f"Failed to initialize MongoDB client: {e}")

class QueryRequest(BaseModel):
    database: str
    collection: str
    type: str # 'find', 'insert', 'update', 'delete', 'aggregate'
    query: Optional[Union[Dict[str, Any], List[Dict[str, Any]]]] = None

@app.post("/api/mongodb/query")
async def execute_query(req: QueryRequest):
    if not client:
        raise HTTPException(status_code=500, detail="MongoDB connection string is not set or invalid.")

    try:
        db = client["ChatRealtimeDB"]
        collection = db[req.collection]
        q = req.query or {}

        if req.type == "find":
            # Finding documents
            cursor = collection.find(q).limit(100) # Limiting to 100 for safety
            results = json.loads(json_util.dumps(list(cursor)))
            return {"status": "success", "data": results, "matchedCount": len(results)}
            
        elif req.type == "insert":
            # Inserting documents
            if isinstance(q, list):
                result = collection.insert_many(q)
                return {"status": "success", "insertedCount": len(result.inserted_ids), "acknowledged": result.acknowledged}
            else:
                result = collection.insert_one(q)
                return {"status": "success", "insertedId": str(result.inserted_id), "acknowledged": result.acknowledged}
            
        elif req.type == "update":
            # Updating documents. Expects payload query format: {"filter": {...}, "update": {"$set": {...}}}
            if "filter" not in q or "update" not in q:
                raise HTTPException(status_code=400, detail="For Update operation, Query Body must contain 'filter' and 'update' keys. Example: {\"filter\": {\"name\": \"John\"}, \"update\": {\"$set\": {\"age\": 30}}}")
            
            result = collection.update_many(q["filter"], q["update"])
            return {"status": "success", "matchedCount": result.matched_count, "modifiedCount": result.modified_count, "acknowledged": result.acknowledged}
            
        elif req.type == "delete":
            # Deleting documents
            result = collection.delete_many(q)
            return {"status": "success", "deletedCount": result.deleted_count, "acknowledged": result.acknowledged}
            
        elif req.type == "aggregate":
            # Aggregation pipeline
            if not isinstance(q, list):
                raise HTTPException(status_code=400, detail="For Aggregate operation, Query Body must be an array of pipeline stages.")
            
            cursor = collection.aggregate(q)
            results = json.loads(json_util.dumps(list(cursor)))
            return {"status": "success", "data": results}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid operation type specified.")

    except PyMongoError as pe:
        raise HTTPException(status_code=500, detail=f"MongoDB Error: {str(pe)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mongodb/collections/{db_name}")
def get_collections(db_name: str):
    if not client:
        raise HTTPException(status_code=500, detail="MongoDB connection string is not set or invalid.")
    try:
        db = client[db_name]
        return {"collections": db.list_collection_names()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "MongoDB Query API is running. Configure MONGO_URI in .env"}
