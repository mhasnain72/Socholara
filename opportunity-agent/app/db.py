from datetime import datetime
from pathlib import Path
import sqlite3
from pymongo import MongoClient, ReturnDocument
from .config import settings


client = MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=10000)
database = client[settings.mongodb_db_name]
opportunities_collection = database["agent_opportunities"]


def _serialize(row: dict) -> dict:
    row = dict(row)
    row.pop("_id", None)
    return row


def init_db() -> None:
    client.admin.command("ping")
    opportunities_collection.create_index("source_url", unique=True)
    opportunities_collection.create_index(
        [("verification_status", 1), ("official_verification_status", 1), ("discovered_at", -1)]
    )
    _migrate_sqlite_records()


def _migrate_sqlite_records() -> None:
    sqlite_path = Path("data/opportunities.db")
    if not sqlite_path.exists():
        return
    connection = sqlite3.connect(sqlite_path)
    connection.row_factory = sqlite3.Row
    try:
        rows = connection.execute("SELECT * FROM opportunities").fetchall()
        migrated = 0
        for row in rows:
            data = dict(row)
            data.setdefault("reviewed_at", None)
            data["migrated_from_sqlite"] = True
            result = opportunities_collection.update_one(
                {"source_url": data["source_url"]},
                {"$setOnInsert": data},
                upsert=True,
            )
            migrated += int(result.upserted_id is not None)
        if migrated:
            print(f"[Agent DB] Migrated {migrated} SQLite opportunities to MongoDB.")
    finally:
        connection.close()


def list_verified_opportunities(opportunity_type: str | None = None, status: str = "pending_review") -> list[dict]:
    query = {
        "verification_status": "verified",
        "official_verification_status": "verified",
    }
    if opportunity_type:
        query["type"] = opportunity_type
    if status != "all":
        query["status"] = status
    return [_serialize(row) for row in opportunities_collection.find(query).sort("discovered_at", -1)]


def get_counts() -> dict:
    rows = list_verified_opportunities(status="all")
    pending_rows = [row for row in rows if row.get("status") == "pending_review"]
    return {
        "total": len(pending_rows),
        "pending_review": len(pending_rows),
        "approved": sum(row.get("status") == "approved" for row in rows),
        "rejected": sum(row.get("status") == "rejected" for row in rows),
        "scholarships": sum(row.get("type") == "scholarship" for row in pending_rows),
        "internships": sum(row.get("type") == "internship" for row in pending_rows),
        "pending_scholarships": sum(row.get("type") == "scholarship" for row in pending_rows),
        "pending_internships": sum(row.get("type") == "internship" for row in pending_rows),
    }


def find_by_source_url(source_url: str) -> dict | None:
    row = opportunities_collection.find_one({"source_url": source_url})
    return _serialize(row) if row else None


def update_opportunity(source_url: str, values: dict) -> None:
    opportunities_collection.update_one({"source_url": source_url}, {"$set": values})


def insert_opportunity(values: dict) -> bool:
    values = {**values, "id": int(datetime.utcnow().timestamp() * 1000000), "status": "pending_review"}
    try:
        opportunities_collection.insert_one(values)
        return True
    except Exception as error:
        if "duplicate key" in str(error).lower():
            return False
        raise


def review_opportunity(opportunity_id: int, status: str) -> dict | None:
    row = opportunities_collection.find_one_and_update(
        {"id": opportunity_id},
        {"$set": {"status": status, "reviewed_at": datetime.utcnow()}},
        return_document=ReturnDocument.AFTER,
    )
    return _serialize(row) if row else None


def get_opportunity(opportunity_id: int) -> dict | None:
    row = opportunities_collection.find_one({"id": opportunity_id})
    return _serialize(row) if row else None
