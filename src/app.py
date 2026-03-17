"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path
import httpx

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


MAX_RELATED_TOPICS = 10


@app.get("/search")
async def search_competitive_analysis(query: str):
    """Search the internet for competitive analysis information using DuckDuckGo"""
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query parameter is required")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.duckduckgo.com/",
                params={
                    "q": query,
                    "format": "json",
                    "no_redirect": "1",
                    "no_html": "1",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            data = response.json()
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Unable to reach the search service. Please check your internet connection.")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Search request timed out. Please try again.")
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail=f"Search service returned an error: {exc.response.status_code}")

    related_topics = []
    for topic in data.get("RelatedTopics", []):
        if isinstance(topic, dict) and topic.get("Text"):
            related_topics.append({
                "text": topic.get("Text", ""),
                "url": topic.get("FirstURL", ""),
            })
        elif isinstance(topic, dict) and topic.get("Topics"):
            for sub in topic.get("Topics", []):
                if isinstance(sub, dict) and sub.get("Text"):
                    related_topics.append({
                        "text": sub.get("Text", ""),
                        "url": sub.get("FirstURL", ""),
                    })
        if len(related_topics) >= MAX_RELATED_TOPICS:
            break

    return {
        "query": query,
        "abstract": data.get("Abstract", ""),
        "abstract_url": data.get("AbstractURL", ""),
        "abstract_source": data.get("AbstractSource", ""),
        "related_topics": related_topics,
    }
