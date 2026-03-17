import { Building2, Users, BookOpen, Calendar } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Dashboard() {
  const classroomUtilization = [
    { day: 'Mon', usage: 85 },
    { day: 'Tue', usage: 95 },
    { day: 'Wed', usage: 75 },
    { day: 'Thu', usage: 88 },
    { day: 'Fri', usage: 78 },
    { day: 'Sat', usage: 45 },
  ]

  const stats = [
    { label: 'Total Classrooms', value: '24', icon: Building2, color: 'blue' },
    { label: 'Total Faculty', value: '48', icon: Users, color: 'green' },
    { label: 'Total Subjects', value: '36', icon: BookOpen, color: 'purple' },
    { label: 'Generated Timetables', value: '12', icon: Calendar, color: 'orange' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`text-${stat.color}-500`} size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Classroom Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classroomUtilization}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="usage" fill="#0066ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Peak Usage</span>
                <span className="text-sm font-semibold text-green-600">Tuesday</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Avg. Usage</span>
                <span className="text-sm font-semibold">77%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '77%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Free Slots</span>
                <span className="text-sm font-semibold">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Timetables */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Timetables</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Semester</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Generated On</th>
              </tr>
            </thead>
            <tbody>
              {[
                { class: 'CS-A', semester: '6th Sem', generatedOn: '2026-03-08' },
                { class: 'IT-B', semester: '4th Sem', generatedOn: '2026-03-07' },
                { class: 'ME-A', semester: '2nd Sem', generatedOn: '2026-03-06' },
                { class: 'EC-B', semester: '8th Sem', generatedOn: '2026-03-05' },
              ].map((item) => (
                <tr key={item.class} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.class}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.semester}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.generatedOn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
