from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.services.travel_buddy_agent import travel_buddy_agent

router = APIRouter()

class TravelBuddyRequest(BaseModel):
    city: str = Field(..., description="Destination city name, e.g., 'Goa', 'Paris', 'Tokyo'")
    budget: float = Field(default=10000.0, description="Total budget amount")
    days: Optional[int] = Field(default=3, description="Duration in days, e.g. 2, 3, 4, 5, 7")
    currency: str = Field(default="INR", description="Currency symbol/code, e.g. 'INR', 'USD', 'EUR'")
    travel_style: Optional[str] = Field(default="explorer", description="Travel vibe: 'explorer', 'foodie', 'relaxed', 'adventure'")

class TravelBuddyResponse(BaseModel):
    success: bool
    markdown: str
    steps: List[Dict[str, Any]]
    data: Dict[str, Any]

@router.post("/generate", response_model=TravelBuddyResponse, status_code=status.HTTP_200_OK)
async def generate_travel_guide(request: TravelBuddyRequest):
    """
    Execute VOYO:
    Autonomously searches for top 3 affordable restaurants, live weather forecast,
    and local events happening this week, formatting the results into a clean structured document.
    """
    try:
        result = travel_buddy_agent.execute(
            city=request.city,
            budget=request.budget,
            days=request.days or 3,
            currency=request.currency,
            travel_style=request.travel_style or "explorer"
        )
        return result
    except Exception as e:
        print(f"[TravelBuddy Error] Failed to generate travel guide: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate travel guide: {str(e)}"
        )

@router.get("/health")
async def health_check():
    return {
        "status": "operational",
        "agent": "The Travel Buddy Agent",
        "version": "2.0.0",
        "tools": [
            "Weather Forecaster (Live Open-Meteo API)",
            "Top 3 Affordable Restaurants Radar",
            "Local Events & Happenings Radar",
            "LangChain Markdown Synthesizer"
        ]
    }
