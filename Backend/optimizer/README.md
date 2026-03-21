# Timetable Optimizer - Google OR-Tools

This directory contains the constraint-based timetable scheduling service using Google OR-Tools.

## Overview

The optimizer uses **CP-SAT (Constraint Programming Solver)** to generate optimal class schedules subject to various constraints:

### Constraints Enforced:
1. **Subject Scheduling**: Each subject is scheduled exactly `classes_per_week` times
2. **Faculty Conflicts**: Faculty cannot teach multiple classes at the same time
3. **Classroom Conflicts**: Each classroom can only be used once per time slot
4. **Faculty Load**: Faculty cannot teach more than `max_classes_per_day` classes in a single day
5. **Comfort Constraints**: Minimizes back-to-back classes for faculty

### Optimization Goals:
- Maximize schedule coverage
- Distribute classes evenly across the week
- Minimize idle time gaps in faculty schedules

## Installation

### Prerequisites
- Python 3.8+
- pip

### Setup

```bash
# Navigate to optimizer directory
cd Backend/optimizer

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Optimizer

```bash
# Start the optimizer server on port 8000
python scheduler.py

# You should see:
# Starting Timetable Optimizer Server on port 8000...
# * Running on http://127.0.0.1:8000
# * Press CTRL+C to quit
```

The optimizer listens on `http://localhost:8000` and expects POST requests to `/optimize` endpoint.

## API Endpoint

### POST /optimize

**Request Format:**
```json
{
  "faculties": [
    {
      "id": 1,
      "name": "Dr. Sarah Johnson",
      "max_classes_per_day": 4,
      "subject_ids": [1, 2]
    }
  ],
  "subjects": [
    {
      "id": 1,
      "name": "Data Structures",
      "classes_per_week": 3,
      "faculty_id": 1
    }
  ],
  "classrooms": [
    {
      "id": 1,
      "name": "Lab-101",
      "capacity": 60
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "entries": [
    {
      "subject_id": 1,
      "faculty_id": 1,
      "classroom_id": 1,
      "day": 0,
      "period": 0,
      "day_name": "Monday",
      "time_slot": "9:00-11:00"
    }
  ],
  "statistics": {
    "total_slots": 12,
    "days_used": 6,
    "classrooms_used": 2
  }
}
```

## Integration with Node.js Backend

The Node.js backend automatically calls this optimizer when generating timetables. The endpoint URL is configured in `Backend/server.js` via the `OPTIMIZER_URL` environment variable.

Default: `http://localhost:8000/optimize`

## Troubleshooting

### ImportError: No module named 'ortools'
```bash
# Ensure you've installed requirements
pip install -r requirements.txt
```

### Port 8000 already in use
```bash
# Find and kill the process using port 8000
# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# On Linux/Mac:
lsof -i :8000
kill -9 <PID>
```

### Solver timeout
The solver has a 30-second timeout. Very large problem instances may fail and fallback to basic scheduling.

## Performance Notes

- **Small instances** (< 50 subjects): < 1 second
- **Medium instances** (50-200 subjects): 2-10 seconds  
- **Large instances** (> 200 subjects): May hit 30-second timeout and use fallback

## Algorithm Details

- **Solver**: CP-SAT (Constraint Programming - Satisfiability)
- **Search Strategy**: Adaptive search with automatic tuning
- **Completeness**: Returns feasible solution or fallback schedule
- **Optimality**: Aims for optimal solution within time limit

## References

- [Google OR-Tools Documentation](https://developers.google.com/optimization)
- [CP-SAT Solver Guide](https://developers.google.com/optimization/cp/cp_solver)
