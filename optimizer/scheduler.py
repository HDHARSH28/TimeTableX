from ortools.sat.python import cp_model
from typing import Dict, List, Any
from models import OptimizeRequest, ScheduledEntry, OptimizeResponse

def solve_timetable(request: OptimizeRequest) -> OptimizeResponse:
    # 1. Initialize the CP-SAT Model
    model = cp_model.CpModel()
    
    subjects = request.subjects
    faculty = request.faculty
    classrooms = request.classrooms
    days = request.days
    slots_per_day = request.slots_per_day
    fixed_entries = request.fixed_entries or []
    
    # 2. Define Decision Variables
    # x[(subject_id, lesson_index, day, slot, classroom_id)] is a boolean variable
    # that is true if lesson 'lesson_index' of subject 'subject_id' is scheduled
    # on day 'day' at slot 'slot' in classroom 'classroom_id'.
    x = {}
    for s in subjects:
        for l in range(s.classesPerWeek):
            for d in range(1, days + 1):
                for h in range(1, slots_per_day + 1):
                    for r in classrooms:
                        var_name = f'x_subj{s.id}_les{l}_day{d}_slot{h}_room{r.id}'
                        x[(s.id, l, d, h, r.id)] = model.NewBoolVar(var_name)
                        
    # 3. Add Constraints
    
    # Constraint 1: Each lesson must be scheduled exactly once
    for s in subjects:
        for l in range(s.classesPerWeek):
            model.Add(
                sum(
                    x[(s.id, l, d, h, r.id)]
                    for d in range(1, days + 1)
                    for h in range(1, slots_per_day + 1)
                    for r in classrooms
                ) == 1
            )
            
    # Constraint 2: Classroom Clash - At most one lesson in a classroom per slot
    for d in range(1, days + 1):
        for h in range(1, slots_per_day + 1):
            for r in classrooms:
                model.Add(
                    sum(
                        x[(s.id, l, d, h, r.id)]
                        for s in subjects
                        for l in range(s.classesPerWeek)
                    ) <= 1
                )
                
    # Constraint 3: Faculty Clash - A faculty member can teach at most one lesson per slot
    for d in range(1, days + 1):
        for h in range(1, slots_per_day + 1):
            for f in faculty:
                # Find all subjects assigned to this faculty
                faculty_subjects = [s for s in subjects if s.facultyId == f.id]
                if faculty_subjects:
                    model.Add(
                        sum(
                            x[(s.id, l, d, h, r.id)]
                            for s in faculty_subjects
                            for l in range(s.classesPerWeek)
                            for r in classrooms
                        ) <= 1
                    )
                    
    # Constraint 4: Cohort Clash - Students in a department/semester (cohort) can attend at most one class per slot
    cohorts = set((s.departmentId, s.semester) for s in subjects)
    for d in range(1, days + 1):
        for h in range(1, slots_per_day + 1):
            for (dept_id, sem) in cohorts:
                cohort_subjects = [s for s in subjects if s.departmentId == dept_id and s.semester == sem]
                if cohort_subjects:
                    model.Add(
                        sum(
                            x[(s.id, l, d, h, r.id)]
                            for s in cohort_subjects
                            for l in range(s.classesPerWeek)
                            for r in classrooms
                        ) <= 1
                    )
                    
    # Constraint 5: Faculty Daily Workload Limit
    for d in range(1, days + 1):
        for f in faculty:
            faculty_subjects = [s for s in subjects if s.facultyId == f.id]
            if faculty_subjects:
                model.Add(
                    sum(
                        x[(s.id, l, d, h, r.id)]
                        for s in faculty_subjects
                        for l in range(s.classesPerWeek)
                        for h in range(1, slots_per_day + 1)
                        for r in classrooms
                    ) <= f.maxClassesPerDay
                )
                
    # Constraint 6: Spread Subjects - Avoid scheduling too many instances of the same subject on the same day
    # Limit to at most 1 instance per day for regular subjects, or 2 for intensive classes/labs
    for s in subjects:
        for d in range(1, days + 1):
            limit = 2 if s.classesPerWeek > 5 else 1
            model.Add(
                sum(
                    x[(s.id, l, d, h, r.id)]
                    for l in range(s.classesPerWeek)
                    for h in range(1, slots_per_day + 1)
                    for r in classrooms
                ) <= limit
            )

    # Constraint 7: Fixed Slots Support
    # If any slot is pre-assigned, force the solver to use it
    for fixed in fixed_entries:
        s_id = fixed.subject_id
        f_id = fixed.faculty_id
        r_id = fixed.classroom_id
        d_val = fixed.day_of_week
        h_val = fixed.slot_index
        
        # Check if subject exists in current optimize request
        target_subject = next((s for s in subjects if s.id == s_id), None)
        if target_subject:
            # Force that exactly one lesson of this subject is scheduled in this specific slot
            model.Add(
                sum(
                    x[(s_id, l, d_val, h_val, r_id)]
                    for l in range(target_subject.classesPerWeek)
                ) == 1
            )
            
    # 4. Objective Function: Compact Schedule & Preferred Timings
    # We want to schedule classes earlier in the day rather than late.
    # Therefore, we minimize the weighted sum of slot indices.
    objective_terms = []
    for s in subjects:
        for l in range(s.classesPerWeek):
            for d in range(1, days + 1):
                for h in range(1, slots_per_day + 1):
                    for r in classrooms:
                        # Weight is higher for later slots: slot 1 weight = 1, slot 6 weight = 6.
                        # Minimizing this will naturally pull schedules to earlier times.
                        objective_terms.append(x[(s.id, l, d, h, r.id)] * h)
                        
    model.Minimize(sum(objective_terms))
    
    # 5. Invoke CP-SAT Solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0 # Stop solver after 10s max
    
    status = solver.Solve(model)
    
    # 6. Parse and Map Results
    schedule_results = []
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        status_name = "optimal" if status == cp_model.OPTIMAL else "feasible"
        
        for s in subjects:
            for l in range(s.classesPerWeek):
                for d in range(1, days + 1):
                    for h in range(1, slots_per_day + 1):
                        for r in classrooms:
                            if solver.Value(x[(s.id, l, d, h, r.id)]) == 1:
                                schedule_results.append(
                                    ScheduledEntry(
                                        subject_id=s.id,
                                        faculty_id=s.facultyId,
                                        classroom_id=r.id,
                                        day_of_week=d,
                                        slot_index=h
                                    )
                                )
        return OptimizeResponse(
            status=status_name,
            schedule=schedule_results,
            message="Timetable optimization completed successfully."
        )
    elif status == cp_model.INFEASIBLE:
        return OptimizeResponse(
            status="infeasible",
            schedule=[],
            message="No feasible solution exists under the specified constraints."
        )
    else:
        return OptimizeResponse(
            status="unknown",
            schedule=[],
            message="Solver finished with an unknown status."
        )
