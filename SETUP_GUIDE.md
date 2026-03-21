# Timetable Scheduler with Google OR-Tools Setup Guide

## Overview

Your timetable scheduler now uses **Google OR-Tools** with constraint-based optimization for intelligent schedule generation. The system consists of:

1. **Frontend** (React/Vite) - http://localhost:5175
2. **Backend API** (Node.js/Express) - http://localhost:3001
3. **Optimizer Service** (Python/OR-Tools) - http://localhost:8000

## Prerequisites

- **Node.js** 14+ ([Download](https://nodejs.org))
- **Python** 3.8+ ([Download](https://www.python.org))
- **npm** (comes with Node.js)
- **pip** (comes with Python)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd Backend
npm install
```

### 2. Install Optimizer Dependencies

```bash
cd Backend/optimizer
pip install -r requirements.txt
```

On Windows, you might need to use `pip3`:
```bash
pip3 install -r requirements.txt
```

### 3. Start All Services

#### Option A: Automatic Script (Recommended for Windows)

```bash
cd Backend
start-services.bat
```

This will open two command windows:
- One for the Python Optimizer
- One for the Node.js Backend

#### Option B: Automatic Script (Linux/Mac)

```bash
cd Backend
chmod +x start-services.sh
./start-services.sh
```

#### Option C: Manual - Start Each Service Separately

**Terminal 1 - Start Optimizer:**
```bash
cd Backend/optimizer
python scheduler.py
# or python3 on Linux/Mac
```

**Terminal 2 - Start Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 3 - Start Frontend:**
```bash
cd Frontend
npm run dev
```

## Service URLs

Once all services are running:

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5175 | Web interface |
| Backend API | http://localhost:3001/api | REST API |
| Optimizer | http://localhost:8000 | Constraint solver |

## How It Works

### 1. Generate Timetable

When you click **"Generate Timetable"** in the frontend:

1. Frontend sends request to Backend API
2. Backend collects all faculties, subjects, and classrooms from database
3. Backend sends data to Python Optimizer service
4. **OR-Tools CP-SAT solver** runs optimization with constraints:
   - Faculty max classes per day
   - No time conflicts for faculty or classrooms
   - Exact subject scheduling (classes_per_week)
   - Minimize gaps in schedules
5. Optimizer returns optimized schedule
6. Backend saves to database
7. Frontend displays the timetable

### 2. Constraints Enforced

| Constraint | Description |
|-----------|-------------|
| **Subject Coverage** | Each subject scheduled exactly `classes_per_week` times |
| **Faculty Availability** | No faculty teaches multiple classes in same time slot |
| **Classroom Availability** | No classroom double-booked in same time slot |
| **Faculty Load** | Faculty can't teach more than `max_classes_per_day` in one day |
| **Conflict-Free** | Optimal assignment avoiding conflicts |

### 3. Optimization Objectives

- Maximize schedule completeness
- Minimize idle gaps for faculty
- Distribute classes evenly across the week

## Testing the Integration

### Test Scenario 1: Basic Schedule Generation

1. Open Frontend: http://localhost:5175
2. Go to **Faculty** → Add test faculty (e.g., "Dr. Test", max 4 classes/day)
3. Go to **Subjects** → Add test subject (e.g., "Math", 3 classes/week, assign to your faculty)
4. Go to **Classrooms** → Add test classroom (e.g., "Lab-101", capacity 60)
5. Go to **Generate Timetable** → Click "Generate"
6. Check **View Timetable** to see the generated schedule

### Test Scenario 2: Complex Schedule

Add multiple faculties, subjects, and classrooms to test the optimizer's ability to solve larger problems.

### Expected Behavior

- ✅ Optimization takes 1-5 seconds for medium-sized problems
- ✅ All constraints are satisfied
- ✅ Schedule is saved to database
- ✅ Can view the generated timetable immediately

## Troubleshooting

### Error: "Failed to fetch faculties" or "Optimizer service unavailable"

**Solution:** Ensure all three services are running:
```bash
# Check Backend is running on port 3001
curl http://localhost:3001/api/faculty

# Check Optimizer is running on port 8000
curl http://localhost:8000/health
```

### Error: "Connection refused" on port 3001 or 8000

**Solution:** Verify services started correctly:
```bash
# Windows - Check running processes
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :3001
lsof -i :8000
```

### Python: "No module named 'ortools'"

**Solution:** Install requirements again:
```bash
cd Backend/optimizer
pip install -r requirements.txt --upgrade
```

### Optimizer times out or uses fallback

The optimizer has a 30-second timeout. Very large problems may use fallback scheduling:
- This is normal for 100+ subjects
- You'll see a message: "Using fallback schedule (OR-Tools optimizer unavailable)"
- The timetable will still be valid but may not be optimal

### Port already in use

**Kill process using port 3001:**
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID {PID} /F

# Linux/Mac
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Kill process using port 8000:**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID {PID} /F

# Linux/Mac
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

## Performance Notes

| Problem Size | Expected Time | Solver Status |
|-------------|---------------|----|
| < 20 subjects | < 1 second | Optimal |
| 20-50 subjects | 1-3 seconds | Optimal/Near-optimal |
| 50-100 subjects | 3-10 seconds | Feasible |
| 100+ subjects | 10-30 seconds | Feasible/Fallback |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
│                  http://localhost:5175                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                    │
│                http://localhost:3001                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ schedulerService.js - Orchestrates scheduling    │   │
│  └────────────────┬─────────────────────────────────┘   │
└────────────────────┼──────────────────────────────────┘
                     │ HTTP POST
                     ↓
┌─────────────────────────────────────────────────────────┐
│         Optimizer Service (Python/Flask)                │
│               http://localhost:8000                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │ scheduler.py - OR-Tools CP-SAT Solver            │   │
│  │ • Models constraints                             │   │
│  │ • Optimizes objectives                           │   │
│  │ • Returns feasible schedule                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `Backend/services/schedulerService.js` | Orchestrates scheduling process |
| `Backend/optimizer/scheduler.py` | OR-Tools constraint solver |
| `Backend/optimizer/requirements.txt` | Python dependencies |
| `Frontend/src/app/pages/GenerateTimetable.tsx` | UI for generation |
| `Frontend/src/app/pages/ViewTimetable.tsx` | Display generated schedule |

## Next Steps

1. ✅ Services running and communicating
2. ✅ Generate and view timetables
3. Consider implementing:
   - Advanced constraints (room preferences, lunch breaks)
   - Multi-year scheduling
   - Student group assignments
   - Load balancing across semesters
   - Export to calendar formats (iCal, Google Calendar)

## Resources

- [Google OR-Tools Docs](https://developers.google.com/optimization)
- [CP-SAT Solver Guide](https://developers.google.com/optimization/cp/cp_solver)
- [Python CP-SAT Examples](https://github.com/google/or-tools/tree/stable/examples/python)

## Support

For issues:
1. Check logs in each terminal
2. Verify all services started: `curl http://localhost:3001/api/faculty` and `curl http://localhost:8000/health`
3. Check firewall settings
4. Ensure Python and Node.js are in PATH

---

Happy scheduling! 🎓
