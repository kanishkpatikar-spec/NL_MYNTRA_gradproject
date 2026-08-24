import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent / "events.db"

def _get_connection():
    # Helper to get DB connection
    return sqlite3.connect(str(DB_PATH))

def log_event(event_type: str, item_id: str = None, module_type: str = None, session_id: str = None, time_spent_ms: int = None) -> str:
    """Logs an event into the SQLite database."""
    event_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    try:
        with _get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO event_log (event_id, event_type, item_id, module_type, session_id, time_spent_ms, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (event_id, event_type, item_id, module_type, session_id, time_spent_ms, timestamp)
            )
            conn.commit()
            return event_id
    except Exception as e:
        logger.error(f"Failed to log event {event_type}: {e}")
        return None

def get_event_summary(days: int = 30) -> dict:
    """Returns a summary of event counts grouped by event_type."""
    try:
        with _get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT event_type, COUNT(*) 
                FROM event_log 
                WHERE datetime(timestamp) >= datetime('now', ?) 
                GROUP BY event_type
                """,
                (f'-{days} days',)
            )
            rows = cursor.fetchall()
            return {row[0]: row[1] for row in rows}
    except Exception as e:
        logger.error(f"Failed to get event summary: {e}")
        return {}
