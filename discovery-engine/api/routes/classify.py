from fastapi import APIRouter, HTTPException
from ..models import ClassifyRequest, ClassifyResponse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from classification.prompt_builder import build_system_prompt, build_user_prompt
from classification.groq_client import GroqClient
from classification.response_parser import parse_and_validate

router = APIRouter()
client = GroqClient()
system_prompt = build_system_prompt()

@router.post("/classify", response_model=ClassifyResponse)
async def classify_text(request: ClassifyRequest):
    """
    Live classifier endpoint.
    Takes a text snippet, queries the Groq API, and returns structured taxonomy labels.
    """
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    try:
        # 1. Build prompt
        user_prompt = build_user_prompt(request.text, "live_demo")
        
        # 2. Call Groq
        raw_response = client.classify(system_prompt, user_prompt)
        
        if not raw_response:
            raise HTTPException(status_code=502, detail="Failed to get a response from Groq API")
            
        # 3. Parse JSON response
        parsed = parse_and_validate(raw_response)
        
        return ClassifyResponse(
            tags=parsed.get("tags", []),
            intensity=parsed.get("intensity", 0),
            paraphrase=parsed.get("paraphrase", ""),
            segments=parsed.get("segments", []),
            reasoning=parsed.get("reasoning", None)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
