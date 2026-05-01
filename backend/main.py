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


# Execute raw MongoDB command
@app.route('/api/mongodb/raw-query', methods=['POST'])
def execute_raw_query():
    if not client:
        return jsonify({"status": "error", "detail": "MongoDB connection not available"}), 503
    
    try:
        data = request.get_json()
        database = data.get('database')
        command = data.get('command', '').strip()
        
        if not command:
            return jsonify({"status": "error", "detail": "Command is required"}), 400
        
        # Remove trailing semicolon (mongosh format)
        if command.endswith(';'):
            command = command[:-1].strip()
        
        # Normalize multiline format - remove extra newlines/spaces
        command = ' '.join(command.split())
        
        # Parse command format: db.collection.method(args)
        base_match = re.match(r'^db\.([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\(([\s\S]*?)\)\s*$', command)
        if not base_match:
            return jsonify({
                "status": "error",
                "detail": "Invalid format. Use: db.collection.method(args) or db.collection.method(args).limit(n)"
            }), 400
        
        collection_name = base_match.group(1)
        method_name = base_match.group(2)
        args_str = base_match.group(3).strip()
        
        # Extract chaining operations (e.g., .limit(5), .sort({...}), .toArray())
        remaining = command[base_match.end():]
        chain_ops = []
        if remaining:
            # Parse chaining like .limit(5), .sort(...), .toArray()
            chain_match = re.findall(r'\.([a-zA-Z0-9_]+)\(([\s\S]*?)\)', remaining)
            chain_ops = chain_match
        
        db = client[database]
        collection = db[collection_name]
        
        # Map JavaScript methods to PyMongo methods
        method_map = {
            "find": "find",
            "findOne": "find_one",
            "insertOne": "insert_one",
            "insertMany": "insert_many",
            "updateOne": "update_one",
            "updateMany": "update_many",
            "deleteOne": "delete_one",
            "deleteMany": "delete_many",
            "aggregate": "aggregate",
            "countDocuments": "count_documents",
            "distinct": "distinct",
            "drop": "drop",
            "deleteOne": "delete_one"
        }
        
        py_method = method_map.get(method_name)
        if not py_method:
            return jsonify({"status": "error", "detail": f"Unsupported method: {method_name}"}), 400
        
        # Parse arguments as JSON
        args = []
        if args_str:
            try:
                # Convert mongosh format to JSON (add quotes to keys)
                # Handle $operators, _id, and other keys without quotes
                json_str = args_str
                # Add quotes to MongoDB operators and unquoted keys
                json_str = re.sub(r'(?<=[{,])\s*(\$?[a-zA-Z_][a-zA-Z0-9_]*)\s*:', r'"\1":', json_str)
                
                args = json.loads(f"[{json_str}]")
            except json.JSONDecodeError as e:
                return jsonify({
                    "status": "error",
                    "detail": f"Invalid JSON in arguments: {str(e)}"
                }), 400
        
        # Execute method
        func = getattr(collection, py_method)
        result = func(*args)
        
        # Apply chaining operations
        for chain_method, chain_args_str in chain_ops:
            if chain_method == "toArray":
                result = list(result)
                break
            elif chain_method == "limit":
                if hasattr(result, 'limit'):
                    try:
                        limit_val = json.loads(f"[{chain_args_str}]")[0]
                        result = result.limit(limit_val)
                    except:
                        pass
            elif chain_method == "sort":
                if hasattr(result, 'sort'):
                    try:
                        sort_spec = json.loads(f"[{chain_args_str}]")[0]
                        result = result.sort(list(sort_spec.items()))
                    except:
                        pass
            elif chain_method == "skip":
                if hasattr(result, 'skip'):
                    try:
                        skip_val = json.loads(f"[{chain_args_str}]")[0]
                        result = result.skip(skip_val)
                    except:
                        pass
        
        # Format response based on method
        if py_method in ["find", "aggregate"]:
            results = json.loads(json_util.dumps(list(result)))
            return jsonify({
                "status": "success",
                "data": results,
                "count": len(results)
            }), 200
        
        elif py_method == "find_one":
            result_data = json.loads(json_util.dumps(result))
            return jsonify({
                "status": "success",
                "data": result_data
            }), 200
        
        elif py_method in ["insert_one", "insert_many"]:
            if py_method == "insert_one":
                return jsonify({
                    "status": "success",
                    "insertedId": str(result.inserted_id)
                }), 200
            else:
                return jsonify({
                    "status": "success",
                    "insertedCount": len(result.inserted_ids),
                    "insertedIds": [str(id) for id in result.inserted_ids]
                }), 200
        
        elif py_method in ["update_one", "update_many"]:
            return jsonify({
                "status": "success",
                "matchedCount": result.matched_count,
                "modifiedCount": result.modified_count
            }), 200
        
        elif py_method in ["delete_one", "delete_many"]:
            return jsonify({
                "status": "success",
                "deletedCount": result.deleted_count
            }), 200
        
        elif py_method == "count_documents":
            return jsonify({
                "status": "success",
                "count": result
            }), 200
        
        else:
            return jsonify({"status": "success", "result": str(result)}), 200
    
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
            "query": "/api/mongodb/query",
            "raw_query": "/api/mongodb/raw-query"
        }
    }), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
