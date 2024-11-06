from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LeadInfo(BaseModel):
    companyName: str

@app.post("/api/enrich")
async def enrich_lead(lead_info: LeadInfo):
    try:
        # Log the incoming request
        logger.info(f"Received enrichment request for company: {lead_info.companyName}")
        
        # Prepare the payload
        payload = {
            "api_key": API_KEY,
            "company": lead_info.companyName
        }
        
        # Make the API request
        response = requests.get(
            "https://api.enrichmentapi.io/company",
            params=payload,
            timeout=10  # Add timeout
        )
        
        # Log the API response
        logger.info(f"API Response Status: {response.status_code}")
        
        # Check if request was successful
        response.raise_for_status()
        
        # Parse and return the entire response data without filtering
        data = response.json()
        if data:
            logger.info(f"Returning full data: {data}")
            return data
        
        # If data is empty, return a clear error message
        logger.warning("API returned empty data")
        raise HTTPException(status_code=404, detail="No data found for the requested company")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making API request: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching data from API")
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the Lead Enrichment API", "status": "operational"}
