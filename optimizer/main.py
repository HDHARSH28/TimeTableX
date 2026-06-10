from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from models import OptimizeRequest, OptimizeResponse
from scheduler import solve_timetable

app = FastAPI(
    title="TimeTableX Optimization Service",
    description="Python FastAPI service wrapper around Google OR-Tools CP-SAT Solver for smart scheduling.",
    version="1.0.0"
)

# Enable CORS for communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
