from fastapi import APIRouter, Request
from ..models import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """
    Basic health check endpoint.
    Also returns the total count of raw snippets to verify DB connectivity.
    """
    supabase = request.app.state.supabase
    try:
        # Just getting the count
        response = supabase.table("raw_snippets").select("id", count="exact").limit(1).execute()
        count = response.count
    except Exception as e:
        count = None
        
    return HealthResponse(status="ok", snippets_count=count)
