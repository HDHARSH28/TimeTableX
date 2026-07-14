import os
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import OptimizeRequest, OptimizeResponse
from scheduler import solve_timetable

app = FastAPI(
    title="TimeTableX Optimization Service",
    description="Python FastAPI service wrapper around Google OR-Tools CP-SAT Solver for smart scheduling.",
    version="1.0.0"
)

# CORS configuration.
# Set ALLOWED_ORIGINS in the environment as a comma-separated list of origins, e.g.:
#   ALLOWED_ORIGINS=http://localhost:5173,https://your-prod-domain.com
# Wildcard ("*") + allow_credentials=True is rejected by browsers and violates
# the CORS spec, so we never combine them.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

# Credentials (cookies / Authorization headers) are only meaningful when a
# specific origin is listed — never with the "*" wildcard.
_allow_credentials = "*" not in ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint to ensure service is live.
    """
    return {"status": "healthy", "service": "TimeTableX Optimization Service"}

@app.post("/api/v1/optimize", response_model=OptimizeResponse, tags=["Optimization"])
def optimize_schedule(request: OptimizeRequest):
    """
    Perform timetable optimization solver using Google OR-Tools CP-SAT constraint programming.
    """
    try:
        response = solve_timetable(request)
        if response.status == "infeasible":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=response.message
            )
        return response
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal Optimizer Error: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
