import { useState, useEffect } from 'react'
import { Edit2, Trash2, Plus } from 'lucide-react'
import Modal from '../components/Modal'
import AlertDialog from '../components/AlertDialog'
import FormInput from '../components/FormInput'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import { useForm, usePagination, useSearch } from '../../hooks/useForm'
import { validateFaculty } from '../../utils/validation'
import { facultyAPI } from '../../services/api'

interface Faculty {
  id: number
  name: string
  max_classes_per_day: number
  subject_ids?: number[]
}

export default function FacultyPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'max_classes_per_day'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  // Fetch faculties on component mount
  useEffect(() => {
    fetchFaculties()
  }, [])

  const fetchFaculties = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await facultyAPI.getAll()
      const data = response.data.data || []
      setFaculties(data)
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch faculties'
      setError(errorMsg)
      console.error('Error fetching faculties:', err)
    } finally {
      setLoading(false)
    }
  }

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(faculties, 'name')
  
  const sortedFaculties = [...filteredItems].sort((a, b) => {
    let aValue = sortBy === 'name' ? a.name : a.max_classes_per_day
    let bValue = sortBy === 'name' ? b.name : b.max_classes_per_day
    
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
    }
    return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const { currentPage, totalPages, startIndex, endIndex, goToPage } = usePagination(sortedFaculties.length, 5)
  const paginatedFaculties = sortedFaculties.slice(startIndex, endIndex)

  const form = useForm(
    { name: '', maxClassesPerDay: '' },
    async (values) => {
      const validationErrors = validateFaculty({name: values.name, max_classes_per_day: parseInt(values.maxClassesPerDay), subject_ids: []})
      if (Object.keys(validationErrors).length === 0) {
        try {
          setApiError(null)
          const payload = {
            name: values.name,
            max_classes_per_day: parseInt(values.maxClassesPerDay),
            subject_ids: selectedFaculty?.subject_ids || []
          }
          
          if (selectedFaculty) {
            await facultyAPI.update(selectedFaculty.id, payload)
          } else {
            await facultyAPI.create(payload)
          }
          
          await fetchFaculties()
          setIsEditModalOpen(false)
          setIsAddModalOpen(false)
          form.reset()
          setSelectedFaculty(null)
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || 'Failed to save faculty'
          setApiError(errorMsg)
          console.error('Error saving faculty:', err)
        }
      } else {
        form.setErrors(validationErrors)
      }
    }
  )

  const handleEdit = (faculty: Faculty) => {
    setSelectedFaculty(faculty)
    form.setValues({
      name: faculty.name,
      maxClassesPerDay: faculty.max_classes_per_day.toString()
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (faculty: Faculty) => {
    setSelectedFaculty(faculty)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedFaculty) {
      try {
        setApiError(null)
        await facultyAPI.delete(selectedFaculty.id)
        await fetchFaculties()
        setIsDeleteDialogOpen(false)
        setSelectedFaculty(null)
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to delete faculty'
        setApiError(errorMsg)
        console.error('Error deleting faculty:', err)
      }
    }
  }

  const handleOpenAdd = () => {
    setSelectedFaculty(null)
    form.reset()
    setApiError(null)
    setIsAddModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading faculties...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage faculty members and their teaching assignments</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Add Faculty
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search faculty..." />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'max_classes_per_day')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="name">Sort by Name</option>
          <option value="max_classes_per_day">Sort by Max Classes/Day</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Max Classes/Day</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFaculties.length > 0 ? (
                paginatedFaculties.map((faculty) => (
                  <tr key={faculty.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{faculty.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{faculty.max_classes_per_day}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEdit(faculty)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(faculty)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No faculties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Add Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Add New Faculty"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Name" 
            name="name" 
            type="text"
            value={form.values.name} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.name} 
            touched={form.touched.name}
            required
          />
          <FormInput 
            label="Max Classes Per Day" 
            name="maxClassesPerDay" 
            type="number"
            value={form.values.maxClassesPerDay} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.max_classes_per_day} 
            touched={form.touched.maxClassesPerDay}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Add Faculty
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Faculty"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Name" 
            name="name" 
            type="text"
            value={form.values.name} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.name} 
            touched={form.touched.name}
            required
          />
          <FormInput 
            label="Max Classes Per Day" 
            name="maxClassesPerDay" 
            type="number"
            value={form.values.maxClassesPerDay} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.max_classes_per_day} 
            touched={form.touched.maxClassesPerDay}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Update Faculty
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Faculty"
        description={`Are you sure you want to delete ${selectedFaculty?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
