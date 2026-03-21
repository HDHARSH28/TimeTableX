# Integration Testing Checklist

## Pre-Deployment Verification

This checklist ensures all components work together before production deployment.

### ✓ Phase 1: Environment Setup

- [ ] Python 3.8+ installed: `python --version`
- [ ] Node.js 16+ installed: `node --version`
- [ ] PostgreSQL running and accessible
- [ ] All npm dependencies installed: `npm install`
- [ ] All Python dependencies installed: `pip install -r requirements.txt`
- [ ] Environment variables configured (.env file exists)
- [ ] Port 5175 available (Frontend)
- [ ] Port 3001 available (Backend)
- [ ] Port 8000 available (Optimizer)

**Verification Script**:
```bash
./verify-setup.py
# All checks should show ✅
```

---

### ✓ Phase 2: Individual Service Health

#### 2.1 Frontend Service

```bash
# In Frontend/ directory:
npm run dev

# Expected output:
#   ✓ ready in 1.23 s
#   ➜  Local:   http://localhost:5175/

# In browser:
# - [ ] http://localhost:5175 loads without errors
# - [ ] Login page displays correctly
# - [ ] No 404 or 500 errors in console
```

**Test**:
```
Open: http://localhost:5175 in browser
Expected: Full page load, no JavaScript errors
Status: ✓
```

---

#### 2.2 Backend Service

```bash
# In Backend/ directory:
npm run dev

# Expected output:
#   > package.json dev
#   Server is running on port 3001
#   Database connected successfully

# In another terminal:
curl http://localhost:3001/api/faculty

# Expected: JSON array (empty or populated)
```

**Test**:
```bash
# Test all main endpoints
curl http://localhost:3001/api/faculty
curl http://localhost:3001/api/subject
curl http://localhost:3001/api/classroom
curl http://localhost:3001/api/timetable

# All should return 200 OK with valid JSON
Status: ✓
```

---

#### 2.3 Optimizer Service

```bash
# In Backend/optimizer/ directory:
python scheduler.py

# Expected output:
#   WARNING in app.py: This is a development server. Do not use it in production.
#   * Running on http://127.0.0.1:8000
#   * Press CTRL+C to quit

# Test health endpoint:
curl http://localhost:8000/health
# Expected: {"status": "ok"}
```

**Test**:
```bash
curl http://localhost:8000/health
# Expected: {"status": "ok"} with status 200
Status: ✓
```

---

### ✓ Phase 3: Backend-to-Optimizer Communication

Test that the Node.js backend can successfully call the Python optimizer.

#### 3.1 Simple Optimization Request

```bash
# Create test payload
cat > test-optimize.json << 'EOF'
{
  "faculties": [
    {
      "id": 1,
      "name": "Dr. Test",
      "max_classes_per_day": 5
    }
  ],
  "subjects": [
    {
      "id": 1,
      "name": "Test Subject",
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
EOF

# Send to optimizer
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d @test-optimize.json | jq .
```

**Expected Response**:
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
    // ... 2 more entries
  ]
}
```

**Checklist**:
- [ ] Response status is 200 OK
- [ ] `success` field is `true`
- [ ] `entries` array has exactly 3 items (1 subject × 3 classes/week)
- [ ] All 3 entries have different `day` or `period` values
- [ ] Day and time labels are readable

---

#### 3.2 Fallback Behavior Test

Verify the optimizer gracefully handles failures.

```bash
# 1. Stop optimizer
pkill -f "python scheduler.py"
# Wait 2 seconds

# 2. Try sending request (should be rejected by optimizer)
curl -X POST http://localhost:8000/optimize \
  -H "Content-Type: application/json" \
  -d @test-optimize.json

# Expected: Connection refused or timeout
```

**Result**:
- [ ] Optimizer is down
- [ ] Request fails with connection error
- [ ] Backend handles gracefully (when integrated)

**Now restart optimizer**:
```bash
cd Backend/optimizer && python scheduler.py
```

---

### ✓ Phase 4: Frontend-to-Backend Integration

Test that the React frontend can perform CRUD operations via the API.

#### 4.1 Create Faculty

```bash
# Using curl (or Frontend UI):
curl -X POST http://localhost:3001/api/faculty \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Alice Smith",
    "max_classes_per_day": 4
  }'

# Expected: 201 Created with returned object containing id
```

**Checklist**:
- [ ] Status code: 201 Created
- [ ] Response includes `id` field (auto-generated)
- [ ] Response includes `name`: "Dr. Alice Smith"
- [ ] Response includes `max_classes_per_day`: 4

---

#### 4.2 Get All Faculties

```bash
curl http://localhost:3001/api/faculty

# Expected: 200 OK with array
```

**Checklist**:
- [ ] Status code: 200 OK
- [ ] Returns array
- [ ] Array includes faculty created above
- [ ] Each item has: id, name, max_classes_per_day

---

#### 4.3 Get Faculty by ID

```bash
# Using ID from creation step (assume id=1)
curl http://localhost:3001/api/faculty/1

# Expected: 200 OK with single object
```

**Checklist**:
- [ ] Status code: 200 OK
- [ ] Returns object (not array)
- [ ] Object has `id`: 1
- [ ] Includes all faculty fields

---

#### 4.4 Update Faculty

```bash
curl -X PUT http://localhost:3001/api/faculty/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Alice Johnson",
    "max_classes_per_day": 3
  }'

# Expected: 200 OK with updated object
```

**Checklist**:
- [ ] Status code: 200 OK
- [ ] Name updated to "Dr. Alice Johnson"
- [ ] max_classes_per_day updated to 3

---

#### 4.5 Delete Faculty

```bash
curl -X DELETE http://localhost:3001/api/faculty/1

# Expected: 200 OK or 204 No Content
```

**Checklist**:
- [ ] Status code: 200 or 204
- [ ] Faculty no longer in list: `curl http://localhost:3001/api/faculty`

---

#### 4.6 Repeat for Subjects and Classrooms

Same workflow as Faculty. Test:
- Create Subject → GET All → GET by ID → Update → Delete
- Create Classroom → GET All → GET by ID → Update → Delete

**Checkpoint**:
- [ ] All CRUD operations work for Faculty
- [ ] All CRUD operations work for Subject
- [ ] All CRUD operations work for Classroom

---

### ✓ Phase 5: End-to-End Timetable Generation

Complete workflow from creation to generation to viewing.

#### 5.1 Setup Test Data

```bash
# These commands build up test data

# 1. Create Faculties
curl -X POST http://localhost:3001/api/faculty \
  -d '{"name": "Dr. Sarah", "max_classes_per_day": 4}' -H "Content-Type: application/json"
# Response: id = 1

curl -X POST http://localhost:3001/api/faculty \
  -d '{"name": "Dr. John", "max_classes_per_day": 3}' -H "Content-Type: application/json"
# Response: id = 2

# 2. Create Subjects (assigned to faculties)
curl -X POST http://localhost:3001/api/subject \
  -d '{"name": "Data Structures", "classes_per_week": 3, "faculty_id": 1}' \
  -H "Content-Type: application/json"
# Response: id = 1

curl -X POST http://localhost:3001/api/subject \
  -d '{"name": "Algorithms", "classes_per_week": 2, "faculty_id": 2}' \
  -H "Content-Type: application/json"
# Response: id = 2

curl -X POST http://localhost:3001/api/subject \
  -d '{"name": "Web Development", "classes_per_week": 2, "faculty_id": 1}' \
  -H "Content-Type: application/json"
# Response: id = 3

# 3. Create Classrooms
curl -X POST http://localhost:3001/api/classroom \
  -d '{"name": "Lab-101", "capacity": 60}' -H "Content-Type: application/json"
# Response: id = 1

curl -X POST http://localhost:3001/api/classroom \
  -d '{"name": "Lab-102", "capacity": 45}' -H "Content-Type: application/json"
# Response: id = 2
```

**Checklist**:
- [ ] Faculty 1 & 2 created successfully
- [ ] Subjects 1, 2, 3 created with correct faculty_id
- [ ] Classrooms 1 & 2 created
- [ ] All IDs returned and noted

---

#### 5.2 Trigger Timetable Generation

```bash
curl -X POST http://localhost:3001/api/timetable/generate

# Expected: 200 OK with timetable object
```

**Response Inspection**:
```bash
# Save response for analysis
curl -X POST http://localhost:3001/api/timetable/generate > timetable.json
cat timetable.json | jq .

# Expected structure:
# {
#   "id": <number>,
#   "status": "generated",
#   "created_at": <timestamp>,
#   "entries": [ ... ],
#   "metadata": {
#     "total_classes": 7,
#     "optimizer_used": true,
#     "fallback": false
#   }
# }
```

**Checklist**:
- [ ] Status code: 200 OK
- [ ] `id` field present (timetable created)
- [ ] `status`: "generated"
- [ ] `entries` array present
- [ ] `metadata.total_classes`: 7 (3+2+2)
- [ ] `metadata.optimizer_used`: true
- [ ] `metadata.fallback`: false

---

#### 5.3 Retrieve Generated Timetable

```bash
# Get by ID (use id from generation response)
curl http://localhost:3001/api/timetable/1

# Or get all timetables
curl http://localhost:3001/api/timetable
```

**Checklist**:
- [ ] Status code: 200 OK
- [ ] Timetable data retrieved successfully
- [ ] Entries array populated

---

#### 5.4 Verify Constraints in Generated Schedule

```bash
# Extract entries and analyze
curl http://localhost:3001/api/timetable/1 | jq '.entries[]' \
  | jq -s 'sort_by(.day, .period) | .[] | "\(.day_name) \(.time_slot): \(.subject_id) - \(.faculty_id) - \(.classroom_id)"'

# Output example:
# Monday 9:00-11:00: 1 - 1 - 1
# Monday 11:00-13:00: 2 - 2 - 2
# Wednesday 1:00-3:00: 1 - 1 - 2
# ...
```

**Manual Constraint Verification**:

Use the constraint checker script:

```python
# Save as verify-timetable.py
import requests

timetable_id = 1  # From generation response

# 1. Get timetable entries
response = requests.get(f'http://localhost:3001/api/timetable/{timetable_id}')
entries = response.json()['entries']

# 2. Verify Constraint C1: Subject Coverage
subject_counts = {}
for e in entries:
    subject_counts[e['subject_id']] = subject_counts.get(e['subject_id'], 0) + 1

print("Subject Coverage:")
for subj_id, count in subject_counts.items():
    print(f"  Subject {subj_id}: {count} classes")
    # C1 PASS if count matches requested classes_per_week

# 3. Verify Constraint C2: Faculty Conflicts
faculty_slots = {}
for e in entries:
    key = (e['faculty_id'], e['day'], e['period'])
    if key in faculty_slots:
        print(f"❌ CONFLICT: Faculty {e['faculty_id']} on day {e['day']} period {e['period']}")
    faculty_slots[key] = True
print("✓ C2: Faculty conflicts checked")

# 4. Verify Constraint C3: Classroom Conflicts
classroom_slots = {}
for e in entries:
    key = (e['classroom_id'], e['day'], e['period'])
    if key in classroom_slots:
        print(f"❌ CONFLICT: Classroom {e['classroom_id']} on day {e['day']} period {e['period']}")
    classroom_slots[key] = True
print("✓ C3: Classroom conflicts checked")

print("\n✓ All constraints satisfied!" if not conflicts else "❌ Conflicts detected")
```

**Checklist**:
- [ ] Run constraint verification script
- [ ] No faculty conflicts found
- [ ] No classroom conflicts found
- [ ] All subjects scheduled expected number of times
- [ ] All faculty within daily workload limits

---

### ✓ Phase 6: Frontend UI Integration

Test the React frontend can generate timetables through UI.

#### 6.1 Navigate to TimetableGenerator Page

```
In browser:
1. Open http://localhost:5175
2. Login (if required)
3. Navigate to "Generate Timetable" or equivalent
4. Check page loads without errors
```

**Checklist**:
- [ ] TimetableGenerator page loads
- [ ] No console errors (F12 → Console)
- [ ] UI elements render correctly

---

#### 6.2 Trigger Generation Through UI

```
1. Click "Generate Timetable" button
2. Wait 1-10 seconds depending on problem size
3. Verify success message
4. Check generated schedule displays
```

**Checklist**:
- [ ] Generation button is clickable
- [ ] Loading spinner appears during generation
- [ ] Success message appears ("Timetable Generated Successfully")
- [ ] Timetable entries display in table/grid format
- [ ] No errors in browser console

---

#### 6.3 View Generated Timetable

```
1. Navigate to "View Timetable" page
2. Select generated timetable from dropdown
3. Verify all entries display
```

**Checklist**:
- [ ] View page loads
- [ ] Timetable dropdown populates with entries
- [ ] Selected timetable displays all entries
- [ ] Time slots and days are properly labeled
- [ ] No duplicate bookings visible

---

### ✓ Phase 7: Error Handling & Edge Cases

#### 7.1 Invalid Input Handling

```bash
# Test invalid faculty creation
curl -X POST http://localhost:3001/api/faculty \
  -H "Content-Type: application/json" \
  -d '{"name": "", "max_classes_per_day": -1}'

# Expected: 400 Bad Request with error message
```

**Checklist**:
- [ ] Invalid inputs rejected with 400 status
- [ ] Error messages are descriptive
- [ ] No data corruption occurs

---

#### 7.2 Missing Data Handling

```bash
# Test generation with insufficient data
# (No classrooms, for example)

curl -X POST http://localhost:3001/api/timetable/generate

# Should either:
# - Generate successfully with available classrooms, or
# - Return 400 with clear error message
```

**Checklist**:
- [ ] System handles missing data gracefully
- [ ] Error message is helpful
- [ ] Database remains consistent

---

#### 7.3 Optimizer Timeout Fallback

```bash
# 1. Create large problem (100+ subjects)
# 2. Watch as optimizer works
# 3. If timeout occurs (30s), verify fallback is used

curl http://localhost:3001/api/timetable/latest | jq '.metadata'
# Should show: "fallback": true
```

**Checklist**:
- [ ] Timetable still generated (even if with fallback)
- [ ] Metadata indicates fallback was used
- [ ] Schedule is valid (no hard constraint violations)
- [ ] User receives appropriate notification

---

### ✓ Phase 8: Performance Baseline

Document performance metrics for future comparison.

```bash
# Small Problem (10 subjects, 5 faculty)
Time: _____ seconds
Optimizer Used: yes / no

# Medium Problem (30 subjects, 10 faculty)
Time: _____ seconds
Optimizer Used: yes / no

# Large Problem (60 subjects, 15 faculty)
Time: _____ seconds
Optimizer Used: yes / no
```

**Expected Performance**:
```
10 subjects, 5 faculty:    < 1 second
30 subjects, 10 faculty:   1-3 seconds
60 subjects, 15 faculty:   3-10 seconds
100+ subjects:             10-30 seconds (may use fallback)
```

**Actual Baseline**:
```
Small: _____ seconds (target: < 1s)
Medium: _____ seconds (target: 1-3s)
Large: _____ seconds (target: 3-10s)
```

---

## Summary & Sign-Off

**Test Date**: _______________
**Tested By**: _______________
**Environment**: Development / Staging / Production

### Overall Results

- [ ] Phase 1: Environment Setup ✓
- [ ] Phase 2: Service Health ✓
- [ ] Phase 3: Backend-to-Optimizer ✓
- [ ] Phase 4: Backend CRUD ✓
- [ ] Phase 5: Timetable Generation ✓
- [ ] Phase 6: Frontend UI ✓
- [ ] Phase 7: Error Handling ✓
- [ ] Phase 8: Performance ✓

**Status**: ✅ Ready for Production / ⚠️ Issues Found

### Issues Found

(If Any)
1. _______________
2. _______________
3. _______________

### Notes

_______________________________________________
_______________________________________________

**Sign-Off**: _________________ Date: __________
