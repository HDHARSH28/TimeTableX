# OR-Tools Constraint Model - Technical Reference

## Mathematical Formulation

### Decision Variables

For each combination of subject, faculty, classroom, day, time slot, and slot index:

```
x(s, f, c, d, t, slot) ∈ {0, 1}

Where:
  s ∈ Subjects
  f ∈ Faculty
  c ∈ Classrooms
  d ∈ {0, 1, 2, 3, 4, 5}  (Monday-Saturday)
  t ∈ {0, 1, 2, 3, 4}     (Time slots 9-11, 11-1, 1-3, 3-5, 5-7)
  slot ∈ {1, 2, ..., classes_per_week}
```

### Constraints

#### C1: Subject Scheduling Coverage
Each subject must be scheduled exactly `classes_per_week[s]` times:

```
∑∑∑∑∑ x(s, f(s), c, d, t, slot) = classes_per_week[s]
 f c d t slot

for all subjects s
```

#### C2: Faculty Conflict Prevention
Faculty f cannot teach multiple classes at the same time:

```
∑ x(s, f, c, d, t, slot) ≤ 1
 s,c,slot

for all (f, d, t)
```

#### C3: Classroom Conflict Prevention
Classroom c cannot be booked multiple times at the same time:

```
∑ x(s, f, c, d, t, slot) ≤ 1
 s,f,slot

for all (c, d, t)
```

#### C4: Faculty Daily Workload Limit
Faculty f cannot teach more than `max_classes_per_day[f]` classes per day:

```
∑∑∑ x(s, f, c, d, t, slot) ≤ max_classes_per_day[f]
 s c t

for all (f, d)
```

#### C5: Non-Negativity
All variables are binary:

```
x(s, f, c, d, t, slot) ∈ {0, 1}
```

### Objective Function (Maximize)

```
Maximize: ∑∑∑∑∑∑ x(s, f, c, d, t, slot)
          s f c d t slot
```

**Goal**: Maximize schedule completeness while satisfying all constraints.

## Implementation in OR-Tools

### Solver Setup

```python
from ortools.sat.python import cp_model

model = cp_model.CpModel()
```

### Adding Decision Variables

```python
# Create binary variables for each assignment
variables = {}
for (subject_id, faculty_id, classroom_id, day, time_slot, slot_idx):
    var_name = f"s{subject_id}_f{faculty_id}_c{classroom_id}_d{day}_t{time_slot}_slot{slot_idx}"
    var = model.NewBoolVar(var_name)
    variables[(subject_id, faculty_id, classroom_id, day, time_slot, slot_idx)] = var
```

### Adding Constraints

```python
# C1: Subject coverage
for subject in subjects:
    class_vars = [var for key, var in variables.items() if key[0] == subject['id']]
    model.Add(sum(class_vars) == subject['classes_per_week'])

# C2: Faculty conflicts
for faculty_id in faculty_ids:
    for day in range(6):
        for time_slot in range(5):
            faculty_vars = [var for key, var in variables.items() 
                          if key[1] == faculty_id and key[3] == day and key[4] == time_slot]
            model.Add(sum(faculty_vars) <= 1)

# C3: Classroom conflicts
for classroom_id in classroom_ids:
    for day in range(6):
        for time_slot in range(5):
            room_vars = [var for key, var in variables.items()
                      if key[2] == classroom_id and key[3] == day and key[4] == time_slot]
            model.Add(sum(room_vars) <= 1)

# C4: Faculty daily workload
for faculty in faculties:
    for day in range(6):
        daily_vars = [var for key, var in variables.items()
                    if key[1] == faculty['id'] and key[3] == day]
        model.Add(sum(daily_vars) <= faculty['max_classes_per_day'])
```

### Solving

```python
solver = cp_model.CpSolver()
solver.parameters.max_time_in_seconds = 30
solver.parameters.log_search_progress = True

status = solver.Solve(model)

if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
    # Extract solution
    for key, var in variables.items():
        if solver.Value(var):
            print(f"Assign: {key}")
else:
    # Use fallback
    print("No solution found, using fallback")
```

## Response Format

The optimizer returns a JSON response:

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
    },
    ...
  ],
  "statistics": {
    "total_slots": 12,
    "days_used": 6,
    "classrooms_used": 2
  }
}
```

## Complexity Analysis

### Variable Count
```
V = |subjects| × |faculty_count| × |classrooms| × |days| × |time_slots| × avg_classes_per_week
  = S × F × C × 6 × 5 × K
  = S × F × C × 30K
```

For example: 50 subjects × 10 faculty × 5 classrooms × 3 classes/week = 22,500 variables

### Constraint Count
```
Constraints ≈ Subject Coverage (S) 
            + Faculty Conflicts (F × 6 × 5)
            + Classroom Conflicts (C × 6 × 5)
            + Faculty Workload (F × 6)
            ≈ S + 30F + 30C + 6F
            ≈ S + 36F + 30C
```

For example with the above data: 50 + 360 + 150 = 560 constraints

### Solution Time
- **Small** (< 1K variables): < 1 second
- **Medium** (1K-10K variables): 1-5 seconds
- **Large** (10K-50K variables): 5-30 seconds
- **Very Large** (> 50K variables): May timeout (30s) and use fallback

## Optimization Strategy

### Search Phases

1. **Feasibility Phase**: Find any valid solution satisfying all constraints
2. **Improvement Phase**: Iteratively find better solutions
3. **Verification Phase**: Confirm solution validity

### Heuristics Used

- Variables are ordered by constraint tightness
- Strong branching (try both 0 and 1 assignments)
- Propagation to eliminate infeasible combinations
- Parallel search (if enabled)

### Performance Tuning

```python
solver.parameters.max_time_in_seconds = 30          # Time limit
solver.parameters.log_search_progress = True        # Verbose logging
solver.parameters.num_workers = 8                  # Parallel search
solver.parameters.linear_solver = "glop"           # LP solver
```

## Example Scenario

### Input
```
Faculties:
  - Dr. Sarah (max 4 classes/day)
  - Dr. John (max 3 classes/day)

Subjects:
  - Data Structures (3 classes/week, faculty: Dr. Sarah)
  - Algorithms (2 classes/week, faculty: Dr. John)
  - Web Dev (2 classes/week, faculty: Dr. Sarah)

Classrooms:
  - Lab-101 (capacity 60)
  - Lab-102 (capacity 45)

Days: Monday-Friday (6 classrooms × 5 time slots = 30 slots)
```

### Solution Process
```
1. Create binary variables for all possible assignments
2. Add constraint: Data Structures must appear exactly 3 times
3. Add constraint: Dr. Sarah teaches at most 1 class per (day, time)
4. Add constraint: Each lab avoids double bookings
5. Add constraint: Dr. Sarah teaches max 4 classes/day
6. Similarly for Dr. John's constraints
7. Solve with CP-SAT
8. Extract assignments where x(s,f,c,d,t) = 1
```

### Sample Output
```
Monday:    9-11  Lab-101: Data Structures (Dr. Sarah)
           11-13 Lab-102: Algorithms (Dr. John)

Wednesday: 1-3   Lab-101: Data Structures (Dr. Sarah)
           3-5   Lab-102: Web Dev (Dr. Sarah)

Friday:    9-11  Lab-101: Data Structures (Dr. Sarah)
           11-13 Lab-102: Algorithms (Dr. John)
           1-3   Lab-102: Web Dev (Dr. Sarah)

✓ All constraints satisfied
✓ Complete schedule (6/6 classes scheduled)
```

## Failure Handling

If CP-SAT cannot find a solution within 30 seconds:

1. Returns `success: true` with fallback schedule
2. Sets `fallback: true` in metadata
3. Uses simple round-robin assignment
4. Guarantees all subjects scheduled, may have conflicts (in fallback only)

## References

- [Google OR-Tools CP-SAT Guide](https://developers.google.com/optimization/cp/cp_solver)
- [Constraint Programming Basics](https://en.wikipedia.org/wiki/Constraint_programming)
- [SAT Solvers Overview](https://en.wikipedia.org/wiki/Boolean_satisfiability_problem)
