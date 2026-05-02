from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError
from dotenv import load_dotenv
from bson import json_util, ObjectId
import os
import json
import re

# Load environment variables
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# MongoDB connection setup
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    print("⚠ MONGO_URI not set in .env")
    client = None
else:
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
        print("✓ MongoDB connection initialized")
    except Exception as e:
        print(f"⚠ MongoDB connection error: {e}")
        client = None


# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    if not client:
        return jsonify({"status": "error", "message": "MongoDB not connected"}), 503
    return jsonify({"status": "healthy", "message": "API is running"}), 200


# Get list of databases
@app.route('/api/mongodb/databases', methods=['GET'])
def get_databases():
    if not client:
        return jsonify({"status": "error", "detail": "MongoDB connection not available"}), 503
    
    try:
        admin_db = client.admin
        databases = admin_db.command("listDatabases")["databases"]
        db_names = [db["name"] for db in databases]
        return jsonify({"status": "success", "databases": db_names}), 200
    except Exception as e:
        return jsonify({"status": "error", "detail": f"Error listing databases: {str(e)}"}), 500


# Get collections in a database
@app.route('/api/mongodb/collections/<database>', methods=['GET'])
def get_collections(database):
    if not client:
        return jsonify({"status": "error", "detail": "MongoDB connection not available"}), 503
    
    try:
        db = client[database]
        collections = db.list_collection_names()
        return jsonify({"status": "success", "collections": collections}), 200
    except Exception as e:
        return jsonify({"status": "error", "detail": f"Error listing collections: {str(e)}"}), 500


# Execute query (find, insert, update, delete, aggregate)
@app.route('/api/mongodb/query', methods=['POST'])
def execute_query():
    if not client:
        return jsonify({"status": "error", "detail": "MongoDB connection not available"}), 503
    
    try:
        data = request.get_json()
        database = data.get('database')
        collection_name = data.get('collection')
        query_type = data.get('type')
        query = data.get('query', {})
        
        if not database or not collection_name:
            return jsonify({"status": "error", "detail": "Database and collection are required"}), 400
        
        db = client[database]
        collection = db[collection_name]
        
        if query_type == "find":
            cursor = collection.find(query).limit(100)
            results = json.loads(json_util.dumps(list(cursor)))
            return jsonify({"status": "success", "data": results, "count": len(results)}), 200
        
        elif query_type == "insert":
            if isinstance(query, list):
                result = collection.insert_many(query)
                return jsonify({
                    "status": "success",
                    "insertedCount": len(result.inserted_ids),
                    "insertedIds": [str(id) for id in result.inserted_ids]
                }), 200
            else:
                result = collection.insert_one(query)
                return jsonify({
                    "status": "success",
                    "insertedId": str(result.inserted_id)
                }), 200
        
        elif query_type == "update":
            if "filter" not in query or "update" not in query:
                return jsonify({
                    "status": "error",
                    "detail": 'Query must have "filter" and "update" keys'
                }), 400
            
            result = collection.update_many(query["filter"], query["update"])
            return jsonify({
                "status": "success",
                "matchedCount": result.matched_count,
                "modifiedCount": result.modified_count
            }), 200
        
        elif query_type == "delete":
            result = collection.delete_many(query)
            return jsonify({
                "status": "success",
                "deletedCount": result.deleted_count
            }), 200
        
        elif query_type == "aggregate":
            if not isinstance(query, list):
                return jsonify({
                    "status": "error",
                    "detail": "Query must be a list of pipeline stages"
                }), 400
            
            cursor = collection.aggregate(query)
            results = json.loads(json_util.dumps(list(cursor)))
            return jsonify({
                "status": "success",
                "data": results,
                "count": len(results)
            }), 200
        
        else:
            return jsonify({"status": "error", "detail": f"Invalid operation type: {query_type}"}), 400
    
    except PyMongoError as e:
        return jsonify({"status": "error", "detail": f"MongoDB error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"status": "error", "detail": f"Server error: {str(e)}"}), 500


# Root endpoint
@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "message": "MongoDB Query API",
        "endpoints": {
            "health": "/api/health",
            "databases": "/api/mongodb/databases",
            "collections": "/api/mongodb/collections/{database}",
            "query": "/api/mongodb/query"
        }
    }), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
