"""
pytest test suite for the CP-SAT timetable solver.

Run from the optimizer/ directory (with venv active):
    pytest test_scheduler.py -v

Each test:
  - builds a small but realistic scheduling scenario
  - calls solve_timetable()
  - asserts the solver found a solution
  - verifies ALL hard constraints are satisfied in the returned schedule:
      * every lesson is placed exactly once
      * no room hosts two lessons at the same time
      * no faculty member teaches two lessons at the same time
      * no student cohort / batch has two lessons at the same time
      * faculty workload per day is within their limit
      * break slots are never used

Constraint-satisfaction is proved on the output, not trusted from the solver
status alone — "optimal" from an incorrect model would still pass naive status
checks, but fail these structural assertions.
"""

import pytest
from collections import defaultdict

from models import (
    OptimizeRequest,
    SubjectModel,
    FacultyModel,
    ClassroomModel,
)
from scheduler import solve_timetable


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def assert_no_room_clash(schedule):
    """No room may host more than one lesson at the same (day, slot)."""
    seen = {}
    for e in schedule:
        key = (e.classroom_id, e.day_of_week, e.slot_index)
        assert key not in seen, (
            f"Room clash: room {e.classroom_id} at day={e.day_of_week} "
            f"slot={e.slot_index} — subjects {seen[key]} and {e.subject_id}"
        )
        seen[key] = e.subject_id


def assert_no_faculty_clash(schedule):
    """No faculty member may teach more than one lesson at the same (day, slot)."""
    seen = {}
    for e in schedule:
        if e.faculty_id is None:
            continue
        key = (e.faculty_id, e.day_of_week, e.slot_index)
        assert key not in seen, (
            f"Faculty clash: faculty {e.faculty_id} at day={e.day_of_week} "
            f"slot={e.slot_index} — subjects {seen[key]} and {e.subject_id}"
        )
        seen[key] = e.subject_id


def assert_no_cohort_clash(schedule, subjects):
    """
    Within the same (departmentId, semester), no two non-batch subjects (or
    subjects of the same batch) may share a (day, slot).
    """
    # Build lookup: optimizer subject_id -> (departmentId, semester, batch_rem)
    subj_map = {}
    for s in subjects:
        rem = None
        if s.id >= 10000:
            rem = s.id % 10000
            if rem > 9:   # co-faculty split, not a batch
                rem = None
        subj_map[s.id] = (s.departmentId, s.semester, rem)

    # group entries by cohort and slot
    # key = (dept, sem, batch_rem_or_None, day, slot)
    seen = {}
    for e in schedule:
        if e.subject_id not in subj_map:
            continue
        dept, sem, batch_rem = subj_map[e.subject_id]
        key = (dept, sem, batch_rem, e.day_of_week, e.slot_index)
        assert key not in seen, (
            f"Cohort clash: dept={dept} sem={sem} batch={batch_rem} at "
            f"day={e.day_of_week} slot={e.slot_index} — "
            f"subjects {seen[key]} and {e.subject_id}"
        )
        seen[key] = e.subject_id


def assert_lessons_placed(schedule, subjects):
    """Each (subject_id, lesson_index) must appear exactly once."""
    placed = defaultdict(int)
    for e in schedule:
        placed[e.subject_id] += 1

    for s in subjects:
        assert placed[s.id] == s.classesPerWeek, (
            f"Subject '{s.name}' (id={s.id}): expected {s.classesPerWeek} "
            f"lessons, got {placed[s.id]}"
        )


def assert_no_break_slots(schedule, breaks):
    """No lesson should land in a break slot."""
    for e in schedule:
        assert e.slot_index not in breaks, (
            f"Lesson for subject {e.subject_id} placed in break slot "
            f"{e.slot_index} on day {e.day_of_week}"
        )


def assert_faculty_daily_workload(schedule, faculty_list):
    """Faculty must not exceed their maxClassesPerDay."""
    fac_map = {f.id: f.maxClassesPerDay for f in faculty_list}
    daily = defaultdict(int)
    for e in schedule:
        if e.faculty_id is not None:
            daily[(e.faculty_id, e.day_of_week)] += 1
    for (fac_id, day), count in daily.items():
        limit = fac_map.get(fac_id, 99)
        assert count <= limit, (
            f"Faculty {fac_id} has {count} classes on day {day}, "
            f"exceeding limit of {limit}"
        )


def run_all_constraint_checks(response, request):
    """Convenience: run every constraint check on a solve response."""
    assert response.status in ("optimal", "feasible"), (
        f"Solver returned '{response.status}': {response.message}"
    )
    s = response.schedule
    assert_no_room_clash(s)
    assert_no_faculty_clash(s)
    assert_no_cohort_clash(s, request.subjects)
    assert_lessons_placed(s, request.subjects)
    if request.breaks:
        assert_no_break_slots(s, request.breaks)
    assert_faculty_daily_workload(s, request.faculty)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def two_theory_subjects():
    """Two theory subjects, two faculty, one classroom — simplest solvable case."""
    subjects = [
        SubjectModel(id=1, name="Data Structures", code="CS301",
                     classesPerWeek=4, facultyId=1, departmentId=1, semester=3),
        SubjectModel(id=2, name="Operating Systems", code="CS303",
                     classesPerWeek=3, facultyId=2, departmentId=1, semester=3),
    ]
    faculty = [
        FacultyModel(id=1, name="Dr. Turing",  maxClassesPerDay=2),
        FacultyModel(id=2, name="Dr. Hopper",  maxClassesPerDay=2),
    ]
    classrooms = [
        ClassroomModel(id=1, name="Room 101", capacity=60, type="classroom"),
    ]
    return OptimizeRequest(subjects=subjects, faculty=faculty,
                           classrooms=classrooms, days=5, slots_per_day=6)


@pytest.fixture
def lab_subject_three_batches():
    """One lab subject split into three batches — tests batch clash constraint."""
    subjects = [
        SubjectModel(id=10001, name="DS Lab (B1)", code="CS302",
                     classesPerWeek=2, facultyId=1, departmentId=1, semester=3, type="lab"),
        SubjectModel(id=10002, name="DS Lab (B2)", code="CS302",
                     classesPerWeek=2, facultyId=2, departmentId=1, semester=3, type="lab"),
        SubjectModel(id=10003, name="DS Lab (B3)", code="CS302",
                     classesPerWeek=2, facultyId=3, departmentId=1, semester=3, type="lab"),
    ]
    faculty = [
        FacultyModel(id=1, name="Dr. A", maxClassesPerDay=3),
        FacultyModel(id=2, name="Dr. B", maxClassesPerDay=3),
        FacultyModel(id=3, name="Dr. C", maxClassesPerDay=3),
    ]
    classrooms = [
        ClassroomModel(id=10, name="Lab 1", capacity=30, type="lab"),
        ClassroomModel(id=11, name="Lab 2", capacity=30, type="lab"),
        ClassroomModel(id=12, name="Lab 3", capacity=30, type="lab"),
    ]
    return OptimizeRequest(subjects=subjects, faculty=faculty,
                           classrooms=classrooms, days=5, slots_per_day=6)


@pytest.fixture
def mixed_theory_and_lab():
    """Theory + lab batches for the same cohort — tests cohort clash."""
    subjects = [
        SubjectModel(id=1, name="Networks",       code="CS401",
                     classesPerWeek=3, facultyId=1, departmentId=2, semester=4),
        SubjectModel(id=20001, name="Net Lab B1", code="CS401L",
                     classesPerWeek=1, facultyId=2, departmentId=2, semester=4, type="lab"),
        SubjectModel(id=20002, name="Net Lab B2", code="CS401L",
                     classesPerWeek=1, facultyId=3, departmentId=2, semester=4, type="lab"),
    ]
    faculty = [
        FacultyModel(id=1, name="Prof. X", maxClassesPerDay=3),
        FacultyModel(id=2, name="Prof. Y", maxClassesPerDay=3),
        FacultyModel(id=3, name="Prof. Z", maxClassesPerDay=3),
    ]
    classrooms = [
        ClassroomModel(id=1, name="Room A",  capacity=60, type="classroom"),
        ClassroomModel(id=20, name="Lab A",  capacity=30, type="lab"),
        ClassroomModel(id=21, name="Lab B",  capacity=30, type="lab"),
    ]
    return OptimizeRequest(subjects=subjects, faculty=faculty,
                           classrooms=classrooms, days=5, slots_per_day=6)


# ─────────────────────────────────────────────────────────────────────────────
# Tests
# ─────────────────────────────────────────────────────────────────────────────

class TestBasicSolving:
    def test_finds_feasible_solution(self, two_theory_subjects):
        resp = solve_timetable(two_theory_subjects)
        assert resp.status in ("optimal", "feasible"), resp.message

    def test_all_lessons_placed(self, two_theory_subjects):
        resp = solve_timetable(two_theory_subjects)
        assert_lessons_placed(resp.schedule, two_theory_subjects.subjects)

    def test_no_room_clash(self, two_theory_subjects):
        resp = solve_timetable(two_theory_subjects)
        assert_no_room_clash(resp.schedule)

    def test_no_faculty_clash(self, two_theory_subjects):
        resp = solve_timetable(two_theory_subjects)
        assert_no_faculty_clash(resp.schedule)

    def test_faculty_workload_respected(self, two_theory_subjects):
        resp = solve_timetable(two_theory_subjects)
        assert_faculty_daily_workload(resp.schedule, two_theory_subjects.faculty)


class TestLabBatches:
    def test_lab_batches_all_placed(self, lab_subject_three_batches):
        resp = solve_timetable(lab_subject_three_batches)
        assert resp.status in ("optimal", "feasible"), resp.message
        assert_lessons_placed(resp.schedule, lab_subject_three_batches.subjects)

    def test_lab_no_room_clash(self, lab_subject_three_batches):
        resp = solve_timetable(lab_subject_three_batches)
        assert_no_room_clash(resp.schedule)

    def test_lab_no_faculty_clash(self, lab_subject_three_batches):
        resp = solve_timetable(lab_subject_three_batches)
        assert_no_faculty_clash(resp.schedule)

    def test_lab_type_rooms_only(self, lab_subject_three_batches):
        """Lab subjects must be placed in lab-type rooms."""
        lab_room_ids = {r.id for r in lab_subject_three_batches.classrooms}
        resp = solve_timetable(lab_subject_three_batches)
        for entry in resp.schedule:
            assert entry.classroom_id in lab_room_ids, (
                f"Lab subject {entry.subject_id} placed in non-lab room {entry.classroom_id}"
            )


class TestMixedCohort:
    def test_full_constraint_check(self, mixed_theory_and_lab):
        resp = solve_timetable(mixed_theory_and_lab)
        run_all_constraint_checks(resp, mixed_theory_and_lab)


class TestBreakSlots:
    def test_no_class_in_break(self):
        """Lessons must not land in break slots."""
        subjects = [
            SubjectModel(id=1, name="Math", code="MA101",
                         classesPerWeek=3, facultyId=1, departmentId=1, semester=1),
        ]
        faculty  = [FacultyModel(id=1, name="Dr. Math", maxClassesPerDay=3)]
        classrooms = [ClassroomModel(id=1, name="Room 1", capacity=40, type="classroom")]
        req = OptimizeRequest(
            subjects=subjects, faculty=faculty, classrooms=classrooms,
            days=5, slots_per_day=6,
            working_days=[1, 2, 3, 4, 5],
            breaks=[3]  # slot 3 is a break
        )
        resp = solve_timetable(req)
        assert resp.status in ("optimal", "feasible"), resp.message
        assert_no_break_slots(resp.schedule, [3])


class TestFacultyAvailability:
    def test_faculty_only_on_available_days(self):
        """Faculty must not be scheduled on days outside their availability."""
        subjects = [
            SubjectModel(id=1, name="Physics", code="PH101",
                         classesPerWeek=2, facultyId=1, departmentId=1, semester=2),
        ]
        faculty = [FacultyModel(id=1, name="Dr. Physics", maxClassesPerDay=2)]
        classrooms = [ClassroomModel(id=1, name="Room 1", capacity=40, type="classroom")]
        # Faculty only available Mon–Wed (days 1,2,3)
        req = OptimizeRequest(
            subjects=subjects, faculty=faculty, classrooms=classrooms,
            days=5, slots_per_day=6,
            working_days=[1, 2, 3, 4, 5],
            faculty_availability={1: [1, 2, 3]}
        )
        resp = solve_timetable(req)
        assert resp.status in ("optimal", "feasible"), resp.message
        for entry in resp.schedule:
            assert entry.day_of_week in [1, 2, 3], (
                f"Faculty 1 scheduled on unavailable day {entry.day_of_week}"
            )


class TestInfeasibleDetection:
    def test_no_valid_room_type_is_infeasible(self):
        """
        A lab subject with no lab classrooms must yield infeasible, not a silent
        omission (fix for the silent lesson-dropping bug).
        """
        subjects = [
            SubjectModel(id=10001, name="CS Lab B1", code="CS1L",
                         classesPerWeek=1, facultyId=1, departmentId=1, semester=1, type="lab"),
        ]
        faculty = [FacultyModel(id=1, name="Dr. X", maxClassesPerDay=3)]
        # Only theory classrooms — no lab rooms available
        classrooms = [ClassroomModel(id=1, name="Room 1", capacity=40, type="classroom")]
        req = OptimizeRequest(subjects=subjects, faculty=faculty,
                              classrooms=classrooms, days=5, slots_per_day=6)
        resp = solve_timetable(req)
        assert resp.status == "infeasible", (
            f"Expected infeasible when no lab rooms exist, got '{resp.status}'"
        )
        assert resp.schedule == []

    def test_too_many_classes_for_available_slots(self):
        """
        More lessons required than available slots must yield infeasible.
        1 subject with 30 classes/week, but only 4 slots across 2 days.
        """
        subjects = [
            SubjectModel(id=1, name="Heavy Subject", code="HV101",
                         classesPerWeek=30, facultyId=1, departmentId=1, semester=1),
        ]
        faculty = [FacultyModel(id=1, name="Dr. X", maxClassesPerDay=99)]
        classrooms = [ClassroomModel(id=1, name="Room 1", capacity=40, type="classroom")]
        req = OptimizeRequest(
            subjects=subjects, faculty=faculty, classrooms=classrooms,
            days=5, slots_per_day=4,
            working_days=[1, 2]  # only 2 days × 4 slots = 8 slots total
        )
        resp = solve_timetable(req)
        # Either pre-flight detects infeasibility or CP-SAT does
        assert resp.status in ("infeasible", "unknown"), (
            f"Expected infeasible/unknown, got '{resp.status}' "
            f"with {len(resp.schedule)} entries"
        )


class TestMultipleSubjectsCohort:
    def test_large_cohort_no_clash(self):
        """
        Realistic scenario: 4 theory subjects + 1 lab (3 batches) for the same
        cohort.  All 13 optimizer subjects must be placed without any clash.
        """
        subjects = [
            SubjectModel(id=1, name="Algorithms",   code="CS501", classesPerWeek=3,
                         facultyId=1, departmentId=1, semester=5),
            SubjectModel(id=2, name="DBMS",          code="CS502", classesPerWeek=3,
                         facultyId=2, departmentId=1, semester=5),
            SubjectModel(id=3, name="Compilers",     code="CS503", classesPerWeek=2,
                         facultyId=3, departmentId=1, semester=5),
            SubjectModel(id=4, name="SE",            code="CS504", classesPerWeek=2,
                         facultyId=4, departmentId=1, semester=5),
            # Lab batches
            SubjectModel(id=50001, name="DBMS Lab B1", code="CS502L", classesPerWeek=1,
                         facultyId=5, departmentId=1, semester=5, type="lab"),
            SubjectModel(id=50002, name="DBMS Lab B2", code="CS502L", classesPerWeek=1,
                         facultyId=5, departmentId=1, semester=5, type="lab"),
            SubjectModel(id=50003, name="DBMS Lab B3", code="CS502L", classesPerWeek=1,
                         facultyId=5, departmentId=1, semester=5, type="lab"),
        ]
        faculty = [FacultyModel(id=i, name=f"Dr.{i}", maxClassesPerDay=3) for i in range(1, 6)]
        classrooms = [
            ClassroomModel(id=1, name="CR-A", capacity=60, type="classroom"),
            ClassroomModel(id=2, name="CR-B", capacity=60, type="classroom"),
            ClassroomModel(id=10, name="Lab-A", capacity=30, type="lab"),
            ClassroomModel(id=11, name="Lab-B", capacity=30, type="lab"),
            ClassroomModel(id=12, name="Lab-C", capacity=30, type="lab"),
        ]
        req = OptimizeRequest(subjects=subjects, faculty=faculty,
                              classrooms=classrooms, days=5, slots_per_day=7)
        resp = solve_timetable(req)
        run_all_constraint_checks(resp, req)
