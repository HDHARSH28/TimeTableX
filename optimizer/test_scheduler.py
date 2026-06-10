from models import OptimizeRequest, SubjectModel, FacultyModel, ClassroomModel
from scheduler import solve_timetable

def run_test():
    print("Running scheduler optimization test...")
    
    # 1. Setup sample data
    subjects = [
        SubjectModel(
            id=1,
            name="Data Structures",
            code="CS301",
            classesPerWeek=4,
            facultyId=1,
            departmentId=1,
            semester=3
        ),
        SubjectModel(
            id=2,
            name="Operating Systems",
            code="CS303",
            classesPerWeek=3,
            facultyId=2,
            departmentId=1,
            semester=3
        )
    ]
    
    faculty = [
        FacultyModel(
            id=1,
            name="Dr. Alan Turing",
            maxClassesPerDay=2 # 2 per day max, total 10 per week
        ),
        FacultyModel(
            id=2,
            name="Dr. Grace Hopper",
            maxClassesPerDay=2 # 2 per day max
        )
    ]
    
    classrooms = [
        ClassroomModel(
            id=1,
            name="Room 101",
            capacity=50,
            type="classroom"
        )
    ]
    
    request = OptimizeRequest(
        subjects=subjects,
        faculty=faculty,
        classrooms=classrooms,
        days=5,
        slots_per_day=6
    )
    
    # 2. Run solver
    response = solve_timetable(request)
    
    # 3. Print verification
    print(f"Solver Status: {response.status}")
    print(f"Message: {response.message}")
    print(f"Total Scheduled Classes: {len(response.schedule)}")
    
    # Assertions
    assert response.status in ["feasible", "optimal"], "Scheduler failed to find a solution!"
    assert len(response.schedule) == 7, f"Expected 7 classes, got {len(response.schedule)}"
    
    # Check overlaps
    slots_used = set()
    faculty_slots = {}
    classroom_slots = {}
    
    for entry in response.schedule:
        slot_key = (entry.day_of_week, entry.slot_index)
        
        # Classroom slot overlap check
        classroom_key = (entry.classroom_id, entry.day_of_week, entry.slot_index)
        assert classroom_key not in classroom_slots, f"Classroom overlap detected for room {entry.classroom_id} at {slot_key}"
        classroom_slots[classroom_key] = entry.subject_id
        
        # Faculty slot overlap check
        faculty_key = (entry.faculty_id, entry.day_of_week, entry.slot_index)
        assert faculty_key not in faculty_slots, f"Faculty overlap detected for teacher {entry.faculty_id} at {slot_key}"
        faculty_slots[faculty_key] = entry.subject_id
        
        slots_used.add(slot_key)
        print(f"Scheduled Subject {entry.subject_id} with Faculty {entry.faculty_id} in Room {entry.classroom_id} at Day {entry.day_of_week}, Slot {entry.slot_index}")

    print("\nAll constraints verified successfully!")
    print("- No classroom overlaps")
    print("- No faculty overlaps")
    print("- Target classes per week satisfied")

if __name__ == "__main__":
    run_test()
