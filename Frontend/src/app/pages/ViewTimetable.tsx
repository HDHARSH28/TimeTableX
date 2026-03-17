import { useState } from 'react'
import SearchBar from '../components/SearchBar'

const subjects = [
  { id: 1, name: 'Data Structures', faculty: 'Dr. Sarah Johnson', room: 'Room 101', color: 'bg-blue-100 text-blue-900' },
  { id: 2, name: 'Algorithms', faculty: 'Dr. Sarah Johnson', room: 'Room 101', color: 'bg-purple-100 text-purple-900' },
  { id: 3, name: 'Database', faculty: 'Prof. Michael Chen', room: 'Lab A', color: 'bg-green-100 text-green-900' },
  { id: 4, name: 'Smart Classroom', faculty: 'Dr. Sarah Johnson', room: 'Room 101', color: 'bg-pink-100 text-pink-900' },
  { id: 5, name: 'Web Dev', faculty: 'Dr. Lisa Anderson', room: 'Lab B', color: 'bg-cyan-100 text-cyan-900' },
]

export default function ViewTimetable() {
  const [selectedClass, setSelectedClass] = useState('CS-A')
  const [searchTerm, setSearchTerm] = useState('')

  const classes = ['CS-A', 'CS-B', 'IT-A', 'IT-B', 'ME-A', 'EC-B']

  const timetableData = {
    'CS-A': {
      semester: '6th Semester',
      schedule: {
        '9:00 - 10:00': { monday: subjects[0], tuesday: subjects[1], wednesday: subjects[2], thursday: subjects[3], friday: subjects[4], saturday: null },
        '10:00 - 11:00': { monday: subjects[1], tuesday: subjects[2], wednesday: subjects[4], thursday: null, friday: null, saturday: null },
        '11:00 - 12:00': { monday: subjects[2], tuesday: subjects[3], wednesday: null, thursday: subjects[0], friday: subjects[1], saturday: null },
        '13:00 - 14:00': { monday: subjects[3], tuesday: subjects[4], wednesday: subjects[1], thursday: subjects[2], friday: null, saturday: null },
        '14:00 - 15:00': { monday: null, tuesday: subjects[0], wednesday: subjects[3], thursday: subjects[4], friday: subjects[2], saturday: null },
      }
    }
  }

  const data = timetableData[selectedClass as keyof typeof timetableData]
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

  // Filter subjects by search term
  const classSubjects = Object.values(data.schedule)
    .flatMap(day => Object.values(day).filter(s => s !== null) as typeof subjects)
  
  const filteredSubjects = searchTerm 
    ? classSubjects.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : classSubjects

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable View</h2>
          <p className="text-gray-600 text-sm mt-1">View weekly timetable schedules</p>
        </div>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {classes.map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="w-full md:w-64">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search subjects..." />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-auto">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Weekly Timetable - {selectedClass}</h3>
          <p className="text-gray-600 text-sm">{data.semester}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-24">TIME</th>
                {days.map((day) => (
                  <th key={day} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 min-w-48">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.schedule).map(([time, dayData]: [string, any]) => (
                <tr key={time} className="border-b border-gray-200">
                  <td className="px-4 py-4 font-semibold text-gray-700 text-sm whitespace-nowrap">{time}</td>
                  {days.map((dayKey) => {
                    const dayLower = dayKey.toLowerCase()
                    const subject = dayData[dayLower]
                    return (
                      <td key={dayKey} className="px-2 py-2">
                        {subject ? (
                          <div className={`${subject.color} p-3 rounded-lg text-center`}>
                            <p className="font-semibold text-sm">{subject.name}</p>
                            <p className="text-xs mt-1 opacity-80">{subject.faculty}</p>
                            <p className="text-xs opacity-80">{subject.room}</p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-gray-100"></div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subjects List */}
      {filteredSubjects.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Classes for {selectedClass}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className={`${subject.color} p-4 rounded-lg`}>
                <p className="font-semibold">{subject.name}</p>
                <p className="text-sm opacity-85">{subject.faculty}</p>
                <p className="text-sm opacity-85">{subject.room}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
