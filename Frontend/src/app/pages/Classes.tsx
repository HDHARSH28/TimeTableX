import { useState } from 'react'
import { Edit2, Trash2, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import AlertDialog from '../components/AlertDialog'
import FormInput from '../components/FormInput'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import { useForm, usePagination, useSearch } from '../../hooks/useForm'
import { validateClass } from '../../utils/validation'

interface Class {
  id: number
  name: string
  year: string
  department: string
  section: string
  maxStudents: number
  currentStudents: number
}

const mockClasses: Class[] = [
  { id: 1, name: 'FY IT-A', year: 'First Year', department: 'IT', section: 'A', maxStudents: 60, currentStudents: 60 },
  { id: 2, name: 'FY IT-B', year: 'First Year', department: 'IT', section: 'B', maxStudents: 60, currentStudents: 58 },
  { id: 3, name: 'SY CS-B', year: 'Second Year', department: 'CS', section: 'B', maxStudents: 65, currentStudents: 62 },
  { id: 4, name: 'TY IT-A', year: 'Third Year', department: 'IT', section: 'A', maxStudents: 60, currentStudents: 55 },
]

export default function Classes() {
  const [classes, setClasses] = useState<Class[]>(mockClasses)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'department'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(classes, 'name')

  const sortedClasses = [...filteredItems].sort((a, b) => {
    let aValue = sortBy === 'name' ? a.name : a.department
    let bValue = sortBy === 'name' ? b.name : b.department
    return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
  })

  const { currentPage, totalPages, startIndex, endIndex, goToPage } = usePagination(sortedClasses.length, 6)
  const paginatedClasses = sortedClasses.slice(startIndex, endIndex)

  const totalStudents = classes.reduce((sum, cls) => sum + cls.currentStudents, 0)
  const avgClassSize = Math.round(totalStudents / classes.length)

  const form = useForm(
    { name: '', year: '', department: '', section: '', maxStudents: '', currentStudents: '' },
    (values) => {
      const errors = validateClass(values)
      if (Object.keys(errors).length === 0) {
        if (selectedClass) {
          setClasses(classes.map(c => 
            c.id === selectedClass.id 
              ? { ...c, name: values.name, year: values.year, department: values.department, section: values.section, maxStudents: parseInt(values.maxStudents), currentStudents: parseInt(values.currentStudents) }
              : c
          ))
          setIsEditModalOpen(false)
        } else {
          setClasses([...classes, {
            id: Math.max(...classes.map(c => c.id), 0) + 1,
            name: values.name,
            year: values.year,
            department: values.department,
            section: values.section,
            maxStudents: parseInt(values.maxStudents),
            currentStudents: parseInt(values.currentStudents)
          }])
          setIsAddModalOpen(false)
        }
        form.reset()
      } else {
        form.setErrors(errors)
      }
    }
  )

  const handleEdit = (cls: Class) => {
    setSelectedClass(cls)
    form.setValues({
      name: cls.name,
      year: cls.year,
      department: cls.department,
      section: cls.section,
      maxStudents: cls.maxStudents.toString(),
      currentStudents: cls.currentStudents.toString()
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (cls: Class) => {
    setSelectedClass(cls)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedClass) {
      setClasses(classes.filter(c => c.id !== selectedClass.id))
      setIsDeleteDialogOpen(false)
      setSelectedClass(null)
    }
  }

  const handleOpenAdd = () => {
    setSelectedClass(null)
    form.reset()
    setIsAddModalOpen(true)
  }

  const stats = [
    { label: 'Total Classes', value: classes.length.toString(), icon: '📚' },
    { label: 'Total Students', value: totalStudents.toString(), icon: '👥' },
    { label: 'Avg. Class Size', value: avgClassSize.toString(), icon: '👨‍🎓' },
    { label: 'Departments', value: new Set(classes.map(c => c.department)).size.toString(), icon: '🏢' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage student classes and their capacities</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Add Class
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search classes..." />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'department')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="name">Sort by Name</option>
          <option value="department">Sort by Department</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedClasses.length > 0 ? (
          paginatedClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                  <p className="text-gray-600 text-sm">{cls.year}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">{cls.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Section:</span>
                  <span className="font-medium text-gray-900">{cls.section}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Students:</span>
                  <span className="font-medium text-gray-900">{cls.maxStudents}</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Capacity:</span>
                  <span className="text-sm font-semibold text-gray-900">{cls.currentStudents} students</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEdit(cls)} className="text-blue-600 hover:text-blue-700 p-1">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDeleteClick(cls)} className="text-red-600 hover:text-red-700 p-1">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-500 py-8">
            No classes found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setIsEditModalOpen(false)
          form.reset()
        }}
        title={selectedClass ? 'Edit Class' : 'Add Class'}
        size="md"
      >
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput
            label="Class Name"
            name="name"
            placeholder="e.g., FY IT-A"
            value={form.values.name}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.name}
            touched={form.touched.name}
            required
          />
          <FormInput
            label="Year"
            name="year"
            placeholder="e.g., First Year"
            value={form.values.year}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.year}
            touched={form.touched.year}
            required
          />
          <FormInput
            label="Department"
            name="department"
            placeholder="e.g., IT"
            value={form.values.department}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.department}
            touched={form.touched.department}
            required
          />
          <FormInput
            label="Section"
            name="section"
            placeholder="e.g., A"
            value={form.values.section}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            touched={form.touched.section}
          />
          <FormInput
            label="Max Students"
            name="maxStudents"
            type="number"
            placeholder="60"
            value={form.values.maxStudents}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.maxStudents}
            touched={form.touched.maxStudents}
            required
          />
          <FormInput
            label="Current Students"
            name="currentStudents"
            type="number"
            placeholder="55"
            value={form.values.currentStudents}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            touched={form.touched.currentStudents}
          />
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false)
                setIsEditModalOpen(false)
                form.reset()
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 transition-colors font-medium"
            >
              {selectedClass ? 'Update' : 'Add'} Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Class"
        description={`Are you sure you want to delete ${selectedClass?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false)
          setSelectedClass(null)
        }}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  )
}
