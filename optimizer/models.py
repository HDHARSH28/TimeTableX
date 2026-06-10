from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class SubjectModel(BaseModel):
    id: int
    name: str
    code: str
    classesPerWeek: int = Field(..., alias="classesPerWeek")
    facultyId: Optional[int] = Field(None, alias="facultyId")
    departmentId: int = Field(..., alias="departmentId")
    semester: int
    type: str = "theory"

    class Config:
        populate_by_name = True

class FacultyModel(BaseModel):
    id: int
    name: str
    maxClassesPerDay: int = Field(..., alias="maxClassesPerDay")

    class Config:
        populate_by_name = True

class ClassroomModel(BaseModel):
    id: int
    name: str
    capacity: int
    type: str

class FixedEntryModel(BaseModel):
    subject_id: int
    faculty_id: int
    classroom_id: int
    day_of_week: int
    slot_index: int

class OptimizeRequest(BaseModel):
    subjects: List[SubjectModel]
    faculty: List[FacultyModel]
    classrooms: List[ClassroomModel]
    days: int = 5
    slots_per_day: int = 6
    fixed_entries: Optional[List[FixedEntryModel]] = None
    breaks: Optional[List[int]] = None
    working_days: Optional[List[int]] = None
    faculty_availability: Optional[Dict[int, List[int]]] = None

class ScheduledEntry(BaseModel):
    subject_id: int
    faculty_id: int
    classroom_id: int
    day_of_week: int
    slot_index: int

class OptimizeResponse(BaseModel):
    status: str
    schedule: List[ScheduledEntry]
    message: Optional[str] = None
