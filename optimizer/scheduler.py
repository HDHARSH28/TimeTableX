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
    
    # Custom availability and parameters
    working_days_list = request.working_days or list(range(1, days + 1))
    breaks_list = request.breaks or []
    faculty_avail = request.faculty_availability or {}
    
    # 2. Define Decision Variables
    # x[(subject_id, lesson_index, day, slot, classroom_id)] is a boolean variable
    x = {}
    for s in subjects:
        for l in range(s.classesPerWeek):
            for d in working_days_list:
                for h in range(1, slots_per_day + 1):
                    # Skip break slots completely
                    if h in breaks_list:
                        continue
                    
                    for r in classrooms:
                        # Restrict classroom type based on subject type
                        is_valid_room = True
                        if s.type == "lab" and r.type != "lab":
                            is_valid_room = False
                        elif s.type in ["theory", "tutorial"] and r.type != "classroom":
                            is_valid_room = False
                        
                        # Faculty Availability check (if day is not a working day for the faculty)
                        if s.facultyId is not None:
                            fac_days = faculty_avail.get(s.facultyId) or faculty_avail.get(str(s.facultyId))
                            if fac_days is not None and d not in fac_days:
                                is_valid_room = False
                        
                        if is_valid_room:
                            var_name = f'x_subj{s.id}_les{l}_day{d}_slot{h}_room{r.id}'
                            x[(s.id, l, d, h, r.id)] = model.NewBoolVar(var_name)
                        
    # 3. Add Constraints
    
    # Constraint 1: Each lesson must be scheduled exactly once
    for s in subjects:
        for l in range(s.classesPerWeek):
            active_vars = [
                x[(s.id, l, d, h, r.id)]
                for d in working_days_list
                for h in range(1, slots_per_day + 1)
                for r in classrooms
                if (s.id, l, d, h, r.id) in x
            ]
            if active_vars:
                model.Add(sum(active_vars) == 1)
            
    # Constraint 2: Classroom Clash - At most one lesson in a classroom per slot
    for d in working_days_list:
        for h in range(1, slots_per_day + 1):
            if h in breaks_list:
                continue
            for r in classrooms:
                active_vars = [
                    x[(s.id, l, d, h, r.id)]
                    for s in subjects
                    for l in range(s.classesPerWeek)
                    if (s.id, l, d, h, r.id) in x
                ]
                if active_vars:
                    model.Add(sum(active_vars) <= 1)
                
    # Constraint 3: Faculty Clash - A faculty member can teach at most one lesson per slot
    for d in working_days_list:
        for h in range(1, slots_per_day + 1):
            if h in breaks_list:
                continue
            for f in faculty:
                # Find all subjects assigned to this faculty
                faculty_subjects = [s for s in subjects if s.facultyId == f.id]
                if faculty_subjects:
                    active_vars = [
                        x[(s.id, l, d, h, r.id)]
                        for s in faculty_subjects
                        for l in range(s.classesPerWeek)
                        for r in classrooms
                        if (s.id, l, d, h, r.id) in x
                    ]
                    if active_vars:
                        model.Add(sum(active_vars) <= 1)
                    
    # Constraint 4: Batch Clash & Cohort Clash
    # Ensure no single student batch (B1, B2, B3) has more than one lesson in a slot.
    # If a theory/tutorial class (which takes the whole cohort) is scheduled, no batch classes can be scheduled.
    cohorts = set((s.departmentId, s.semester) for s in subjects)
    for d in working_days_list:
        for h in range(1, slots_per_day + 1):
            if h in breaks_list:
                continue
            for (dept_id, sem) in cohorts:
                cohort_subjects = [s for s in subjects if s.departmentId == dept_id and s.semester == sem]
                if cohort_subjects:
                    cohort_wide_vars = []
                    batch_vars = {1: [], 2: [], 3: []}
                    
                    for s in cohort_subjects:
                        is_batch = False
                        batch_num = 0
                        if s.id >= 10000:
                            rem = s.id % 10000
                            if 1 <= rem <= 3:
                                is_batch = True
                                batch_num = rem
                        
                        for l in range(s.classesPerWeek):
                            for r in classrooms:
                                if (s.id, l, d, h, r.id) in x:
                                    if is_batch:
                                        batch_vars[batch_num].append(x[(s.id, l, d, h, r.id)])
                                    else:
                                        cohort_wide_vars.append(x[(s.id, l, d, h, r.id)])
                    
                    for b in [1, 2, 3]:
                        active_terms = cohort_wide_vars + batch_vars[b]
                        if active_terms:
                            model.Add(sum(active_terms) <= 1)
                    
    # Constraint 5: Faculty Daily Workload Limit
    for d in working_days_list:
        for f in faculty:
            faculty_subjects = [s for s in subjects if s.facultyId == f.id]
            if faculty_subjects:
                active_vars = [
                    x[(s.id, l, d, h, r.id)]
                    for s in faculty_subjects
                    for l in range(s.classesPerWeek)
                    for h in range(1, slots_per_day + 1)
                    for r in classrooms
                    if (s.id, l, d, h, r.id) in x
                ]
                if active_vars:
                    model.Add(sum(active_vars) <= f.maxClassesPerDay)
                
    # Constraint 6: Spread Subjects - Avoid scheduling too many instances of the same subject on the same day
    for s in subjects:
        for d in working_days_list:
            limit = s.classesPerWeek if s.type == "lab" else (2 if s.classesPerWeek > 5 else 1)
            active_vars = [
                x[(s.id, l, d, h, r.id)]
                for l in range(s.classesPerWeek)
                for h in range(1, slots_per_day + 1)
                for r in classrooms
                if (s.id, l, d, h, r.id) in x
            ]
            if active_vars:
                model.Add(sum(active_vars) <= limit)

    # Constraint 7: Fixed Slots Support
    for fixed in fixed_entries:
        s_id = fixed.subject_id
        f_id = fixed.faculty_id
        r_id = fixed.classroom_id
        d_val = fixed.day_of_week
        h_val = fixed.slot_index
        
        target_subject = next((s for s in subjects if s.id == s_id), None)
        if target_subject:
            active_vars = [
                x[(s_id, l, d_val, h_val, r_id)]
                for l in range(target_subject.classesPerWeek)
                if (s_id, l, d_val, h_val, r_id) in x
            ]
            if active_vars:
                model.Add(sum(active_vars) == 1)
            
    # 4. Helper variables to reward consecutive labs (Requirement 2)
    # Y[(s_id, d, h)] will be 1 if subject s is scheduled at day d, slot h.
    Y = {}
    for s in subjects:
        for d in working_days_list:
            for h in range(1, slots_per_day + 1):
                if h in breaks_list:
                    continue
                active_vars_sdh = [
                    x[(s.id, l, d, h, r.id)]
                    for l in range(s.classesPerWeek)
                    for r in classrooms
                    if (s.id, l, d, h, r.id) in x
                ]
                if active_vars_sdh:
                    Y_var = model.NewBoolVar(f'Y_subj{s.id}_day{d}_slot{h}')
                    model.Add(Y_var == sum(active_vars_sdh))
                    Y[(s.id, d, h)] = Y_var

    # C[(s_id, d, h)] is 1 if subject s is scheduled in slots h and h+1 on day d.
    C = {}
    for s in subjects:
        if s.type == "lab":
            for d in working_days_list:
                for h in range(1, slots_per_day):
                    if h in breaks_list or (h + 1) in breaks_list:
                        continue
                    if (s.id, d, h) in Y and (s.id, d, h + 1) in Y:
                        c_var = model.NewBoolVar(f'C_subj{s.id}_day{d}_slot{h}')
                        model.Add(c_var <= Y[(s.id, d, h)])
                        model.Add(c_var <= Y[(s.id, d, h + 1)])
                        C[(s.id, d, h)] = c_var

    # 5. Objective Function: Compact Schedule & Preferred Timings & Consecutive Labs
    objective_terms = []
    for s in subjects:
        for l in range(s.classesPerWeek):
            for d in working_days_list:
                for h in range(1, slots_per_day + 1):
                    for r in classrooms:
                        if (s.id, l, d, h, r.id) in x:
                            objective_terms.append(x[(s.id, l, d, h, r.id)] * h)
                            
    # Reward consecutive labs with a weight of 15
    for c_var in C.values():
        objective_terms.append(c_var * -15)
                        
    model.Minimize(sum(objective_terms))
    
    # 6. Invoke CP-SAT Solver
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0 # Stop solver after 10s max
    
    status = solver.Solve(model)
    
    # 7. Parse and Map Results
    schedule_results = []
    
    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        status_name = "optimal" if status == cp_model.OPTIMAL else "feasible"
        
        for s in subjects:
            for l in range(s.classesPerWeek):
                for d in working_days_list:
                    for h in range(1, slots_per_day + 1):
                        for r in classrooms:
                            if (s.id, l, d, h, r.id) in x and solver.Value(x[(s.id, l, d, h, r.id)]) == 1:
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
