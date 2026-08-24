from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/")
async def download_export(format: str = "json"):
    """
    Returns the aggregated export file in the requested format (json, csv, or corpus).
    """
    export_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
        "exports"
    )
    
    if format == "json":
        filename = "aggregated_export.json"
        media_type = "application/json"
    elif format == "csv":
        filename = "opportunity_table.csv"
        media_type = "text/csv"
    elif format == "corpus":
        filename = "review_corpus.json"
        media_type = "application/json"
    else:
        raise HTTPException(status_code=400, detail="Invalid format. Allowed: json, csv, corpus")
        
    file_path = os.path.join(export_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file not found. Run aggregation pipeline first.")
        
    return FileResponse(
        path=file_path, 
        filename=filename, 
        media_type=media_type
    )
