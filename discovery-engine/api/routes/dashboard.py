from fastapi import APIRouter, Request, HTTPException
from typing import List, Dict, Any
import json
import os

router = APIRouter()

@router.get("/opportunities", response_model=List[Dict[str, Any]])
async def get_opportunities(request: Request, limit: int = 10):
    """
    Returns ranked opportunity scores from the aggregation_results table.
    """
    supabase = request.app.state.supabase
    try:
        response = (
            supabase.table("aggregation_results")
            .select("*")
            .order("opportunity_score", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/drivers")
async def get_drivers(request: Request):
    """
    Returns summary stats for all drivers.
    Currently simply reads the same aggregation_results table but ordered by frequency.
    """
    supabase = request.app.state.supabase
    try:
        response = (
            supabase.table("aggregation_results")
            .select("driver_id, driver_label, frequency, avg_intensity")
            .order("frequency", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/cooccurrence")
async def get_cooccurrence():
    """
    Returns the co-occurrence matrix from the exported JSON.
    """
    export_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
        "exports", 
        "aggregated_export.json"
    )
    
    if not os.path.exists(export_path):
        raise HTTPException(status_code=404, detail="Aggregated export not found. Run aggregation pipeline first.")
        
    try:
        with open(export_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("cooccurrence_matrix", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading export file: {str(e)}")
