# OR-Tools Optimizer - Debugging & Troubleshooting Guide

## Quick Diagnostics

### Service Not Starting

**Symptom**: `python scheduler.py` fails to start

**Checklist**:
```bash
# 1. Verify Python installation
python --version
# Expected: Python 3.8 or higher

# 2. Verify requirements are installed
pip list | grep -i ortools
# Expected: ortools 9.7.2996 or higher

# 3. Check if port 8000 is available
# Windows:
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :8000
# Should be empty or show only our process

# 4. Try running with verbose output
python scheduler.py -v
```

**Solutions**:

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: No module named 'flask'` | Run `pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'ortools'` | Run `pip install ortools==9.7.2996` |
| `Address already in use` | Port 8000 occupied; kill process or change port in scheduler.py line 5 |
| `Permission denied` | Run terminal as administrator (Windows) or `sudo` (Linux/Mac) |
| `python: command not found` | Python not in PATH; use `python3` or add Python to PATH |

---

## Optimizer Performance Issues

### Slow Solution (Takes > 30 seconds)

**Symptoms**:
- Timetable generation takes longer than expected
- Optimizer timeout (switches to fallback)
- Console shows "max_time_in_seconds limit reached"

**Root Causes**:

1. **Problem Too Large** (100+ subjects)
   ```
   Time = O(S × F × C × 30K) in worst case
   Solution Time ≈ 10-30+ seconds for 100+ subjects
   ```

2. **Tight Constraints** (impossible to satisfy?)
   ```
   Example: 10 faculty, max 2 classes/day each = max 120 classes/week
   But trying to schedule 150 subjects = INFEASIBLE
   ```

3. **SOLUTION**: Reduce problem size or increase timeout

**Solutions**:

```python
# In Backend/optimizer/scheduler.py, line ~110:

# Increase timeout (but user experience suffers)
solver.parameters.max_time_in_seconds = 60  # was 30

# OR: Reduce input size
# - Divide faculties across multiple timetables
# - Create weekly vs bi-weekly schedules
# - Consolidate small subjects
```

**Fallback Verification**:
```bash
# If solver times out, check fallback was used:

# 1. Check server logs for:
#    "max_time_in_seconds limit reached"
#    "Using fallback schedule"

# 2. Verify timetable was still created:
#    GET http://localhost:3001/api/timetable
#    Should show recent entry with status 'generated'

# 3. Check for conflicts in fallback:
#    GET http://localhost:3001/api/timetable/{id}/entries
#    May show same classroom/faculty in same timeslot
```

---

### Solution Quality Issues

**Symptom**: Generated timetable has conflicts or looks unbalanced

**Diagnosis**:

```bash
# 1. Verify all constraints
curl -X GET http://localhost:3001/api/timetable/latest/entries

# 2. Check for faculty conflicts (same faculty in 2 slots same time):
jq -r '.[] | "\(.day_name) \(.time_slot): \(.faculty_id)"' \
  | sort | uniq -d

# 3. Check for classroom conflicts:
jq -r '.[] | "\(.day_name) \(.time_slot): \(.classroom_id)"' \
  | sort | uniq -d

# 4. Verify fallback was NOT used:
curl -X GET http://localhost:3001/api/timetable/{id} \
  | jq '.metadata'
# Should show "fallback": false for optimal solution
```

**Common Issues**:

| Issue | Cause | Fix |
|-------|-------|-----|
| Unbalanced distribution (all Mon-Wed) | Solver preferences | Check objective weights |
| Faculty conflicts despite constraints | Constraint error | Review `_add_constraints()` |
| Fallback used when optimal exists | Timeout too short | Increase max_time_in_seconds |
| Classroom double-booked | Database error | Check TimetableEntry persistence |

---

## Constraint Validation

### Manual Constraint Checking

```python
# Script to verify all 5 constraints on generated schedule

def verify_constraints(timetable_entries, subjects, faculties, classrooms):
    """Validate that all constraints satisfied"""
    
    # C1: Subject Coverage
    subject_counts = {}
    for e in timetable_entries:
        subject_id = e['subject_id']
        subject_counts[subject_id] = subject_counts.get(subject_id, 0) + 1
    
    for subject in subjects:
        expected = subject['classes_per_week']
        actual = subject_counts.get(subject['id'], 0)
        assert actual == expected, f"Subject {subject['id']}: expected {expected}, got {actual}"
    print("✓ C1: Subject coverage OK")
    
    # C2: Faculty Conflicts
    faculty_slots = {}
    for e in timetable_entries:
        key = (e['faculty_id'], e['day'], e['period'])
        if key in faculty_slots:
            raise AssertionError(f"Faculty conflict: {e['faculty_id']} on {e['day_name']} {e['time_slot']}")
        faculty_slots[key] = True
    print("✓ C2: Faculty conflicts OK")
    
    # C3: Classroom Conflicts
    classroom_slots = {}
    for e in timetable_entries:
        key = (e['classroom_id'], e['day'], e['period'])
        if key in classroom_slots:
            raise AssertionError(f"Classroom conflict: {e['classroom_id']} on {e['day_name']} {e['time_slot']}")
        classroom_slots[key] = True
    print("✓ C3: Classroom conflicts OK")
    
    # C4: Faculty Workload
    faculty_daily = {}
    for e in timetable_entries:
        key = (e['faculty_id'], e['day'])
        faculty_daily[key] = faculty_daily.get(key, 0) + 1
    
    for key, count in faculty_daily.items():
        faculty_id, day = key
        faculty = next(f for f in faculties if f['id'] == faculty_id)
        max_daily = faculty['max_classes_per_day']
        assert count <= max_daily, f"Faculty {faculty_id} day {day}: {count} > {max_daily}"
    print("✓ C4: Faculty workload OK")
    
    print("✓ All constraints satisfied!")

# Usage:
# verify_constraints(timetable_entries, subjects, faculties, classrooms)
```

---

## Common Error Messages

### 400 Bad Request

```json
{
  "error": "Invalid payload structure",
  "details": "Missing 'faculties' in request body"
}
```

**Solutions**:
- Verify request body has: `{ "faculties": [...], "subjects": [...], "classrooms": [...] }`
- Check all required fields in each object
- Validate JSON syntax using: `jq '.' < request.json`

---

### 422 Unprocessable Entity

```json
{
  "error": "Invalid problem size",
  "details": "Subjects > 200"
}
```

**Solutions**:
- Reduce input size to limit: 200 subjects, 50 faculties, 50 classrooms
- Split large problems across multiple optimization runs
- Consolidate small subjects into combined courses

---

### 500 Internal Server Error

```json
{
  "error": "Optimizer exception",
  "traceback": "..."
}
```

**Debugging**:
```bash
# 1. Check server logs:
tail -f optimizer.log

# 2. Re-run with verbose output:
python scheduler.py

# 3. Verify input data validity:
# - No duplicate IDs
# - Faculty IDs referenced exist
# - Classroom IDs referenced exist
# - classes_per_week > 0 for all subjects
# - max_classes_per_day > 0 for all faculty
```

**Common Causes**:
- Duplicate IDs in input
- Faculty/classroom ID mismatch
- Invalid numeric values (negative, zero, null)
- Memory exhaustion (very large problem)

---

## Performance Profiling

### Measuring Solver Time

```python
import time
from ortools.sat.python import cp_model

# Add timing to scheduler.py:

def build_schedule(self):
    start_time = time.time()
    
    self._add_assignment_variables()
    print(f"Variables created: {len(self.variables)} ({time.time()-start_time:.2f}s)")
    
    self._add_constraints()
    print(f"Constraints added: ({time.time()-start_time:.2f}s)")
    
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30
    
    solve_start = time.time()
    status = solver.Solve(self.model)
    solve_time = time.time() - solve_start
    
    print(f"Solver status: {status.name}")
    print(f"Solve time: {solve_time:.2f}s")
    print(f"Solutions found: {solver.InfoStats()['num_explored_leaves']}")
    
    total_time = time.time() - start_time
    print(f"Total time: {total_time:.2f}s")
```

### Expected Performance Baselines

```
Input Size               | Variables    | Constraints | Time
10 subjects, 5 faculty  | ~1,500       | 150         | < 0.1s
30 subjects, 10 faculty | ~45,000      | 400         | 0.5-1s
50 subjects, 15 faculty | ~112,500     | 600         | 1-3s
100 subjects, 20 faculty| ~600,000     | 1,000       | 5-15s
150+ subjects           | > 1,000,000  | > 1,500     | 20-30s
```

---

## Testing Procedures

### Unit Test: Single Subject

```bash
# Test case: 1 subject, 1 faculty, 1 classroom
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "faculties": [{"id": 1, "name": "Dr. Test", "max_classes_per_day": 5}],
    "subjects": [{"id": 1, "name": "Test Subject", "classes_per_week": 3, "faculty_id": 1}],
    "classrooms": [{"id": 1, "name": "Lab-101", "capacity": 60}]
  }'

# Expected: 3 entries for same subject on different days/times
```

### Integration Test: Fallback Behavior

```bash
# 1. Stop Python optimizer:
pkill -f "python scheduler.py" # Linux/Mac
taskkill /f /im python.exe     # Windows (caution!)

# 2. Try generating timetable through frontend
# Should succeed with fallback schedule

# 3. Check metadata shows fallback:
curl http://localhost:3001/api/timetable/latest | jq '.metadata'
# Should show: "fallback": true

# 4. Restart optimizer
cd Backend/optimizer && python scheduler.py
```

### Stress Test: Large Problem

```bash
# Create test data: 100 subjects, 20 faculty, 10 classrooms
# Record CPU and memory usage

# Monitor:
# Windows: Task Manager → Python process
# Linux: top -p $(pgrep -f scheduler.py)

# Expected limits:
# - Memory: < 2GB
# - CPU: 80-100%
# - Time: < 30s total
```

---

## Log Analysis

### Enable Detailed Logging

```python
# In scheduler.py, add:

import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('optimizer.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Usage:
logger.debug(f"Creating {len(self.variables)} variables")
logger.info("Solver converged to optimal solution")
logger.warning("Problem may be infeasible")
logger.error("Failed to parse input payload")
```

### Interpreting Solver Output

```
INFO:ortools.sat.python.cp_model: Starting expansion
INFO:ortools.sat.python.cp_model: Model size: 45000 variables, 400 constraints
INFO:ortools.sat.python.cp_solver: Solution found in 2.3s with objective: 50
...progress lines...
INFO:ortools.sat.python.cp_solver: ... and solution found in 2.5s with objective: 50.
INFO:ortools.sat.python.cp_solver: ===== SOLVING STOPPED BY TIME LIMIT =====
```

**Interpretation**:
- "Solution found in 2.3s with objective: 50" = Found valid schedule
- "and solution found in 2.5s with objective: 50" = No better solution found after
- "SOLVING STOPPED BY TIME LIMIT" = Hit 30-second timeout (normal)

---

## Recovery Procedures

### Recovering from Corrupted State

```bash
# Case 1: Database out of sync with actual schedules
# Solution: Delete orphaned timetable entries
psql -U postgres -d timetable_db -c "
  DELETE FROM timetable_entries 
  WHERE timetable_id NOT IN (SELECT id FROM timetables);
"

# Case 2: Optimizer cache corruption
# Solution: Clear and restart
rm optimizer.log
pkill -f scheduler.py
cd Backend/optimizer && python scheduler.py

# Case 3: Port conflict
# Solution: Find and kill process
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # Linux/Mac
kill -9 <PID>
```

### Database Rollback

```bash
# If constraint violations found in database:

# 1. Identify affected timetable
psql -U postgres -d timetable_db -c "
  SELECT id, created_at FROM timetables 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC LIMIT 5;
"

# 2. Delete problematic entries
psql -U postgres -d timetable_db -c "
  DELETE FROM timetable_entries 
  WHERE timetable_id = <ID>;
  
  DELETE FROM timetables 
  WHERE id = <ID>;
"

# 3. Re-run optimization
# Through frontend: Create Faculty → Create Subjects → Generate
```

---

## Support Resources

**Useful Commands**:
```bash
# Check all services running
curl http://localhost:5175      # Frontend
curl http://localhost:3001/api/faculty  # Backend
curl http://localhost:8000/health    # Optimizer

# View recent logs
tail -20 /var/log/syslog | grep python  # Linux
Get-EventLog System -Newest 20 | select-string python  # Windows

# Test optimizer directly
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d @test-payload.json | jq .
```

**External Resources**:
- [Google OR-Tools Troubleshooting](https://developers.google.com/optimization/troubleshooting)
- [SAT Solver Documentation](https://github.com/google/or-tools)
- [Flask Debugging Guide](https://flask.palletsprojects.com/en/latest/debugging/)
