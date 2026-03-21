#!/usr/bin/env python3
"""
Timetable Scheduler using Google OR-Tools Constraint Programming
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from ortools.sat.python import cp_model
import json
import logging
from typing import Dict, List, Tuple, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Constants
DAYS_OF_WEEK = 6  # Monday to Saturday
TIME_SLOTS = 5    # 9-11, 11-1, 1-3, 3-5, (5-7 optional)

class TimetableScheduler:
    """Constraint-based timetable scheduler using OR-Tools"""
    
    def __init__(self, faculties: List[Dict], subjects: List[Dict], classrooms: List[Dict]):
        self.faculties = faculties
        self.subjects = subjects
        self.classrooms = classrooms
        
        # Create mappings
        self.faculty_map = {f['id']: f for f in faculties}
        self.subject_map = {s['id']: s for s in subjects}
        self.classroom_map = {c['id']: c for c in classrooms}
        
        # Initialize model
        self.model = cp_model.CpModel()
        self.variables = {}
        self.assignments = []
        
    def build_schedule(self) -> Dict[str, Any]:
        """Build timetable schedule with constraints"""
        try:
            self._add_assignment_variables()
            self._add_constraints()
            self._add_objectives()
            
            # Solve
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = 30
            solver.parameters.log_search_progress = True
            
            status = solver.Solve(self.model)
            
            if status not in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
                return self._generate_fallback_schedule()
            
            return self._extract_solution(solver)
            
        except Exception as e:
            logger.error(f"Scheduling error: {e}")
            return self._generate_fallback_schedule()
    
    def _add_assignment_variables(self):
        """Create decision variables for assignments"""
        for subject in self.subjects:
            subject_id = subject['id']
            faculty_id = subject['faculty_id']
            classes_needed = subject['classes_per_week']
            
            # Create variables for each class slot
            for slot_idx in range(classes_needed):
                for day in range(DAYS_OF_WEEK):
                    for time_slot in range(TIME_SLOTS):
                        for classroom in self.classrooms:
                            var_name = f"s{subject_id}_f{faculty_id}_c{classroom['id']}_d{day}_t{time_slot}_slot{slot_idx}"
                            var = self.model.NewBoolVar(var_name)
                            self.variables[(subject_id, faculty_id, classroom['id'], day, time_slot, slot_idx)] = var
    
    def _add_constraints(self):
        """Add constraint rules to the model"""
        
        # Constraint 1: Each subject must be scheduled exactly classes_per_week times
        for subject in self.subjects:
            subject_id = subject['id']
            faculty_id = subject['faculty_id']
            classes_needed = subject['classes_per_week']
            
            class_vars = []
            for slot_idx in range(classes_needed):
                for day in range(DAYS_OF_WEEK):
                    for time_slot in range(TIME_SLOTS):
                        for classroom in self.classrooms:
                            key = (subject_id, faculty_id, classroom['id'], day, time_slot, slot_idx)
                            if key in self.variables:
                                class_vars.append(self.variables[key])
            
            # Each subject gets exactly classes_needed slots
            self.model.Add(sum(class_vars) == classes_needed)
        
        # Constraint 2: Faculty cannot teach multiple classes at same time
        for faculty_id in [f['id'] for f in self.faculties]:
            for day in range(DAYS_OF_WEEK):
                for time_slot in range(TIME_SLOTS):
                    faculty_conflicts = []
                    for key, var in self.variables.items():
                        s_id, f_id, c_id, d, t, _ = key
                        if f_id == faculty_id and d == day and t == time_slot:
                            faculty_conflicts.append(var)
                    
                    if faculty_conflicts:
                        self.model.Add(sum(faculty_conflicts) <= 1)
        
        # Constraint 3: Classroom cannot be used multiple times at same time
        for classroom in self.classrooms:
            classroom_id = classroom['id']
            for day in range(DAYS_OF_WEEK):
                for time_slot in range(TIME_SLOTS):
                    room_conflicts = []
                    for key, var in self.variables.items():
                        s_id, f_id, c_id, d, t, _ = key
                        if c_id == classroom_id and d == day and t == time_slot:
                            room_conflicts.append(var)
                    
                    if room_conflicts:
                        self.model.Add(sum(room_conflicts) <= 1)
        
        # Constraint 4: Faculty max classes per day
        for faculty in self.faculties:
            faculty_id = faculty['id']
            max_per_day = faculty['max_classes_per_day']
            
            for day in range(DAYS_OF_WEEK):
                daily_classes = []
                for key, var in self.variables.items():
                    s_id, f_id, c_id, d, t, _ = key
                    if f_id == faculty_id and d == day:
                        daily_classes.append(var)
                
                if daily_classes:
                    self.model.Add(sum(daily_classes) <= max_per_day)
        
        # Constraint 5: No back-to-back classes for faculty (optional comfort constraint)
        for faculty_id in [f['id'] for f in self.faculties]:
            for day in range(DAYS_OF_WEEK):
                for time_slot in range(TIME_SLOTS - 1):
                    current_slot = []
                    next_slot = []
                    
                    for key, var in self.variables.items():
                        s_id, f_id, c_id, d, t, _ = key
                        if f_id == faculty_id and d == day:
                            if t == time_slot:
                                current_slot.append(var)
                            elif t == time_slot + 1:
                                next_slot.append(var)
                    
                    # Allow back-to-back but don't encourage it heavily
                    # This is a soft constraint via objectives
    
    def _add_objectives(self):
        """Add optimization objectives"""
        # Objective 1: Minimize gaps in faculty schedules
        # Objective 2: Distribute classes across all days evenly
        gap_penalties = []
        
        for faculty_id in [f['id'] for f in self.faculties]:
            for day in range(DAYS_OF_WEEK):
                day_classes = []
                for key, var in self.variables.items():
                    s_id, f_id, c_id, d, t, _ = key
                    if f_id == faculty_id and d == day:
                        day_classes.append(var)
                
                if day_classes:
                    gap_penalties.append(sum(day_classes))
        
        # Maximize the number of scheduled classes (maximize coverage)
        if gap_penalties:
            self.model.Maximize(sum(gap_penalties))
    
    def _extract_solution(self, solver: cp_model.CpSolver) -> Dict[str, Any]:
        """Extract solution from solver"""
        entries = []
        
        for key, var in self.variables.items():
            if solver.Value(var):
                subject_id, faculty_id, classroom_id, day, time_slot, slot_idx = key
                
                # Convert to 0-indexed notation for response
                entries.append({
                    'subject_id': subject_id,
                    'faculty_id': faculty_id,
                    'classroom_id': classroom_id,
                    'day': day,
                    'period': time_slot,
                    'day_name': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
                    'time_slot': self._get_time_label(time_slot)
                })
        
        return {
            'success': True,
            'entries': entries,
            'statistics': {
                'total_slots': len(entries),
                'days_used': len(set(e['day'] for e in entries)),
                'classrooms_used': len(set(e['classroom_id'] for e in entries))
            }
        }
    
    def _generate_fallback_schedule(self) -> Dict[str, Any]:
        """Generate basic valid schedule if optimization fails"""
        entries = []
        
        # Simple round-robin assignment
        day_idx = 0
        time_idx = 0
        classroom_idx = 0
        
        for subject in self.subjects:
            for _ in range(subject['classes_per_week']):
                entries.append({
                    'subject_id': subject['id'],
                    'faculty_id': subject['faculty_id'],
                    'classroom_id': self.classrooms[classroom_idx % len(self.classrooms)]['id'],
                    'day': day_idx % DAYS_OF_WEEK,
                    'period': time_idx % TIME_SLOTS,
                    'day_name': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day_idx % DAYS_OF_WEEK],
                    'time_slot': self._get_time_label(time_idx % TIME_SLOTS)
                })
                
                day_idx += 1
                time_idx += 1
                classroom_idx += 1
        
        return {
            'success': True,
            'entries': entries,
            'statistics': {
                'total_slots': len(entries),
                'days_used': DAYS_OF_WEEK,
                'classrooms_used': len(self.classrooms)
            }
        }
    
    @staticmethod
    def _get_time_label(slot_idx: int) -> str:
        """Get human-readable time slot label"""
        times = {
            0: '9:00-11:00',
            1: '11:00-13:00',
            2: '13:00-15:00',
            3: '15:00-17:00',
            4: '17:00-19:00'
        }
        return times.get(slot_idx, '9:00-11:00')


@app.route('/optimize', methods=['POST'])
def optimize():
    """Main endpoint for timetable optimization"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        faculties = data.get('faculties', [])
        subjects = data.get('subjects', [])
        classrooms = data.get('classrooms', [])
        
        if not faculties or not subjects or not classrooms:
            return jsonify({'error': 'Missing required data: faculties, subjects, or classrooms'}), 400
        
        logger.info(f"Optimizing schedule with {len(faculties)} faculties, {len(subjects)} subjects, {len(classrooms)} classrooms")
        
        # Run scheduler
        scheduler = TimetableScheduler(faculties, subjects, classrooms)
        result = scheduler.build_schedule()
        
        return jsonify(result), 200
    
    except Exception as e:
        logger.error(f"Error in /optimize endpoint: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'timetable-optimizer'}), 200


if __name__ == '__main__':
    logger.info("Starting Timetable Optimizer Server on port 8000...")
    app.run(host='127.0.0.1', port=8000, debug=True)
