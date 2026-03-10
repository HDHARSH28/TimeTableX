# Smart Classroom & Timetable Scheduler Backend

Production-ready REST API built with Node.js, Express, PostgreSQL, and Sequelize.

## Features
- Faculty, Subject, Classroom management (CRUD limited to Create + List)
- Timetable generation via external Python optimizer (`http://localhost:8000/optimize`)
- Timetable retrieval with relational data
- Clean modular structure (routes, controllers, models, services)

## Project Structure
```
Backend/
├── app.js
├── server.js
├── config/
│   ├── config.js
│   └── database.js
├── models/
│   ├── index.js
│   ├── faculty.js
│   ├── subject.js
│   ├── classroom.js
│   ├── timetable.js
│   └── timetableEntry.js
├── controllers/
├── routes/
├── services/
│   └── schedulerService.js
└── migrations/
```

## Setup
1. Create environment file:
   - Copy `.env.example` to `.env` and adjust values.

2. Ensure PostgreSQL is running and accessible.

3. Install dependencies (already done):

```bash
cd Backend
npm install
```

4. Run migrations:

```bash
cd Backend
npm run db:migrate
```

5. Start the server:

```bash
cd Backend
npm run dev
# or
npm start
```

## API Endpoints
- `POST /api/faculty` — Add faculty `{ name, max_classes_per_day, subject_ids? }`
- `GET /api/faculty` — List faculty including `subject_ids`
- `POST /api/subjects` — Add subject `{ name, classes_per_week, faculty_id }`
- `GET /api/subjects` — List subjects (with faculty info)
- `POST /api/classrooms` — Add classroom `{ name, capacity }`
- `GET /api/classrooms` — List classrooms
- `POST /api/generate-timetable` — Generate timetable via Python optimizer
- `GET /api/timetable/:id` — Retrieve timetable entries

## Notes
- Timetable entries store: `day`, `period`, `classroom_id`, `subject_id`, `faculty_id`.
- Optimizer response expected shape:
```json
{
  "entries": [
    { "day": "Monday", "period": 1, "classroom_id": 1, "subject_id": 2, "faculty_id": 3 }
  ]
}
```
- Optional DB sync can be added, but migrations are recommended for production.

## Python Optimizer
- The service must listen on `OPTIMIZER_URL` (default `http://localhost:8000/optimize`).
- Backend sends the following payload:
```json
{
  "faculties": [{"id":1,"name":"...","max_classes_per_day":3,"subject_ids":[2,3]}],
  "subjects": [{"id":2,"name":"...","classes_per_week":4,"faculty_id":1}],
  "classrooms": [{"id":1,"name":"A-101","capacity":40}]
}
```