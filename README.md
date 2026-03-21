# Smart Classroom Timetable Scheduler with Google OR-Tools

A full-stack intelligent timetable generation system using constraint-based optimization with Google OR-Tools.

## 📋 Features

✅ **Constraint-Based Scheduling** using Google OR-Tools CP-SAT Solver  
✅ **Smart Faculty Management** with workload limits  
✅ **Subject Scheduling** with faculty assignments  
✅ **Classroom Management** with capacity tracking  
✅ **Intelligent Timetable Generation** avoiding all conflicts  
✅ **Real-time Validation** of constraints  
✅ **Fallback Scheduling** when optimizer is unavailable  
✅ **Responsive Web Interface** with React/Vite  
✅ **REST API** with Express.js  
✅ **Database Persistence** with PostgreSQL  

## 🏗️ System Architecture

```
┌─────────────────────────────────────┐
│   Frontend (React + TypeScript)     │
│   http://localhost:5175              │
└────────────────┬────────────────────┘
                 │ HTTP
                 ↓
┌─────────────────────────────────────┐
│   Backend API (Node.js + Express)   │
│   http://localhost:3001              │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ schedulerService.js          │   │
│  │ ✓ Fetches faculty/subjects   │   │
│  │ ✓ Validates constraints       │   │
│  │ ✓ Persists to database       │   │
│  └────────────────┬─────────────┘   │
└────────────────────┼──────────────┘
                     │ HTTP POST
                     ↓
┌─────────────────────────────────────┐
│ Optimizer (Python + Flask)           │
│ http://localhost:8000                │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ scheduler.py                 │   │
│  │ ✓ Builds constraint model     │   │
│  │ ✓ Runs OR-Tools CP-SAT        │   │
│  │ ✓ Returns optimal schedule    │   │
│  └──────────────────────────────┘   │
│                                      │
│  DATABASE: PostgreSQL                │
│  ✓ Faculties, Subjects, Classrooms  │
│  ✓ Timetables, Entries              │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** 14+ ([Download](https://nodejs.org))
- **Python** 3.8+ ([Download](https://www.python.org))
- **PostgreSQL** 12+ (or update `.env` for your database)

### 2. Install Dependencies

```bash
# Backend
cd Backend
npm install

# Optimizer
cd Backend/optimizer
pip install -r requirements.txt
```

### 3. Start All Services

**Windows:**
```bash
cd Backend
start-services.bat
```

**Linux/Mac:**
```bash
cd Backend
chmod +x start-services.sh
./start-services.sh
```

**Manual setup:**
```bash
# Terminal 1: Optimizer
cd Backend/optimizer
python scheduler.py

# Terminal 2: Backend
cd Backend
npm run dev

# Terminal 3: Frontend
cd Frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:5175
- **API**: http://localhost:3001/api
- **Optimizer**: http://localhost:8000

## 📊 Constraint Solving

### Constraints Implemented (OR-Tools)

1. **Subject Coverage**: Each subject must be scheduled exactly `classes_per_week` times
2. **Faculty Conflicts**: Faculty cannot teach multiple classes simultaneously
3. **Classroom Conflicts**: Classroom cannot be booked for multiple classes at same time
4. **Faculty Workload**: Faculty cannot teach more than `max_classes_per_day`
5. **Resource Availability**: Only assigned faculty teach their subjects

### Optimization Objectives

- Maximize schedule completeness
- Minimize gaps in faculty schedules
- Distribute classes evenly across the week
- Minimize back-to-back classes

### Solver Details

- **Algorithm**: CP-SAT (Constraint Programming - SAT)
- **Solver Type**: Google OR-Tools
- **Time Limit**: 30 seconds
- **Completeness**: Returns feasible solution guaranteed
- **Optimality**: Aims for optimal within time limit

## 🎯 How to Use

### 1. Create Faculty Members

Go to **Faculty Management**:
- Click "Add Faculty"
- Enter name and max classes per day (e.g., 4)
- Save

### 2. Create Subjects

Go to **Subjects Management**:
- Click "Add Subject"
- Enter subject name and classes per week (e.g., 3)
- Assign to faculty
- Save

### 3. Create Classrooms

Go to **Classrooms Management**:
- Click "Add Classroom"
- Enter classroom name and capacity
- Save

### 4. Generate Timetable

Go to **Generate Timetable**:
- Select class/semester (if applicable)
- Click "Generate Timetable"
- Wait for optimization (usually 1-5 seconds)
- Confirm generation

### 5. View Generated Timetable

Go to **View Timetable**:
- Select the class to view
- See the weekly schedule grid
- All conflicts automatically resolved!

## 📁 Project Structure

```
Time_Table/
├── Backend/
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Entry point
│   ├── package.json
│   ├── config/
│   │   ├── database.js           # Sequelize config
│   │   └── config.js
│   ├── models/                   # Database models
│   ├── controllers/              # Request handlers
│   ├── routes/                   # API routes
│   ├── services/
│   │   └── schedulerService.js   # Scheduling logic
│   ├── migrations/               # DB migrations
│   ├── optimizer/                # Python optimizer
│   │   ├── scheduler.py          # OR-Tools implementation
│   │   ├── requirements.txt
│   │   └── README.md
│   ├── start-services.bat        # Windows start script
│   └── start-services.sh         # Unix start script
├── Frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx           # Main app
│   │   │   ├── pages/            # Page components
│   │   │   │   ├── Faculty.tsx
│   │   │   │   ├── Subjects.tsx
│   │   │   │   ├── Classrooms.tsx
│   │   │   │   ├── GenerateTimetable.tsx
│   │   │   │   └── ViewTimetable.tsx
│   │   │   └── components/       # Reusable components
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   └── hooks/
│   │       └── useForm.ts        # Custom hooks
│   ├── package.json
│   └── vite.config.ts
├── SETUP_GUIDE.md                # Detailed setup instructions
└── verify-setup.py               # Verification script
```

## 🔧 Environment Configuration

Create `.env` file in Backend root:

```env
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=root
DB_NAME=timetable_db
DB_DIALECT=postgres

# Server
PORT=3001
NODE_ENV=development

# Optimizer
OPTIMIZER_URL=http://localhost:8000/optimize

# Frontend
FRONTEND_URL=http://localhost:5175
```

## 🧪 Verification

Run the setup verification script:

```bash
python verify-setup.py
```

This checks:
- ✅ All required files exist
- ✅ Python is installed
- ✅ OR-Tools is available
- ✅ All services are running

## 📊 Example Usage Flow

### Data Setup
```
Faculty: Dr. Sarah (max 4 classes/day)
Subject: Data Structures (3 classes/week, taught by Dr. Sarah)
Classroom: Lab-101 (capacity 60)
```

### Generation Process
```
1. User clicks "Generate Timetable"
2. Backend fetches all data
3. OR-Tools models constraints:
   - Data Structures must be in 3 time slots
   - Dr. Sarah can't teach multiple classes simultaneously
   - Lab-101 can't be double-booked
   - Dr. Sarah teaches max 4 classes per day
4. Solver finds optimal assignment
5. Returns: Monday 9-11 Lab-101, Wednesday 13-15 Lab-101, Friday 15-17 Lab-101
6. Timetable saved and displayed
```

## 📈 Performance Metrics

| Problem Size | Solution Time | Optimality |
|-------------|---------------|----|
| 10 subjects | < 1s | Optimal |
| 30 subjects | 1-3s | Optimal |
| 50 subjects | 3-8s | Optimal/Near-optimal |
| 100 subjects | 10-30s | Feasible |
| 100+ subjects | 30s timeout | Uses fallback |

## 🛠️ Troubleshooting

### Services Won't Start

1. **Check Python installation**:
   ```bash
   python --version
   ```

2. **Check Node.js installation**:
   ```bash
   node --version
   npm --version
   ```

3. **Install dependencies**:
   ```bash
   pip install -r Backend/optimizer/requirements.txt
   npm install  # in Backend and Frontend
   ```

### Optimizer Service Shows Error

- **"Connection refused"**: Make sure Python optimizer is running on port 8000
- **"Module not found"**: Run `pip install ortools`
- **Timeout error**: Problem is too large, using fallback scheduler

### API Errors

- **"Cannot GET /api/faculty"**: Ensure backend is running on port 3001
- **Database errors**: Check PostgreSQL is running and `.env` is correct

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed troubleshooting.

## 📚 Documentation

- **[Setup Guide](./SETUP_GUIDE.md)**  - Detailed installation and configuration
- **[Optimizer README](./Backend/optimizer/README.md)** - OR-Tools implementation details
- **[API Documentation](./Backend/README.md)** - REST API endpoints

## 🔗 Links

- [Google OR-Tools](https://developers.google.com/optimization)
- [CP-SAT Solver](https://developers.google.com/optimization/cp/cp_solver)
- [React Documentation](https://react.dev)
- [Express.js](https://expressjs.com)
- [Sequelize ORM](https://sequelize.org)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please submit pull requests with:
- Clear description of changes
- Updated documentation
- Test cases where applicable

## 📞 Support

For issues or questions:
1. Check the [Troubleshooting section](#-troubleshooting)
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. Check service logs in terminal windows

---

**Ready to generate optimal timetables!** 🎓📅
