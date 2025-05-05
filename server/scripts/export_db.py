import json
from replit import db

# Export all data from replit.db into a JSON file
data = dict(db)

with open("replit_db_export.json", "w") as f:
    json.dump(data, f)
