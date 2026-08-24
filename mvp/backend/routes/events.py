from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from backend.services import event_logger

router = APIRouter(prefix="/api/events", tags=["events"])

class EventRequest(BaseModel):
    event: str
    data: dict
    session_id: Optional[str] = None

@router.post("")
def log_event(request: EventRequest):
    """Log a new event from the frontend."""
    item_id = request.data.get("item_id")
    module_type = request.data.get("module_type")
    
    event_id = event_logger.log_event(
        event_type=request.event,
        item_id=item_id,
        module_type=module_type,
        session_id=request.session_id
    )
    
    if event_id:
        return {"status": "success", "event_id": event_id}
    return {"status": "error", "message": "Failed to log event"}

@router.get("/summary")
def get_events_summary(days: int = 30):
    """Get a summary of events for the last N days."""
    summary = event_logger.get_event_summary(days)
    return {"status": "success", "summary": summary}
