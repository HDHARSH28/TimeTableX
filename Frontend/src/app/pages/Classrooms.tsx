import { useState, useEffect } from "react"
import { Edit2, Trash2, Plus } from "lucide-react"
import Modal from "../components/Modal"
import AlertDialog from "../components/AlertDialog"
import FormInput from "../components/FormInput"
import SearchBar from "../components/SearchBar"
import Pagination from "../components/Pagination"
import { useForm, usePagination, useSearch } from "../../hooks/useForm"
import { validateClassroom } from "../../utils/validation"
import { classroomAPI } from "../../services/api"

interface Classroom {
  id: number
  name: string
  capacity: number
}

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "capacity">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await classroomAPI.getAll()
      setClassrooms(response.data.data || [])
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch classrooms"
      setError(errorMsg)
      console.error("Error fetching classrooms:", err)
    } finally {
      setLoading(false)
    }
  }

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(classrooms, "name")
  
  const sortedClassrooms = [...filteredItems].sort((a, b) => {
    let aValue = sortBy === "name" ? a.name : a.capacity
    let bValue = sortBy === "name" ? b.name : b.capacity
    
    if (typeof aValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
    }
    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const { currentPage, totalPages, startIndex, endIndex, goToPage } = usePagination(sortedClassrooms.length, 6)
  const paginatedClassrooms = sortedClassrooms.slice(startIndex, endIndex)

  const form = useForm(
    { name: "", capacity: "" },
    async (values) => {
      const validationErrors = validateClassroom({ name: values.name, capacity: parseInt(values.capacity) })
      if (Object.keys(validationErrors).length === 0) {
        try {
          setApiError(null)
          const payload = { name: values.name, capacity: parseInt(values.capacity) }
          
          if (selectedClassroom) {
            await classroomAPI.update(selectedClassroom.id, payload)
          } else {
            await classroomAPI.create(payload)
          }
          
          await fetchClassrooms()
          setIsEditModalOpen(false)
          setIsAddModalOpen(false)
          form.reset()
          setSelectedClassroom(null)
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || "Failed to save classroom"
          setApiError(errorMsg)
          console.error("Error saving classroom:", err)
        }
      } else {
        form.setErrors(validationErrors)
      }
    }
  )

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    form.setValues({ name: classroom.name, capacity: classroom.capacity.toString() })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedClassroom) {
      try {
        await classroomAPI.delete(selectedClassroom.id)
        await fetchClassrooms()
        setIsDeleteDialogOpen(false)
        setSelectedClassroom(null)
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Failed to delete classroom"
        setApiError(errorMsg)
      }
    }
  }

  const handleOpenAdd = () => {
    setSelectedClassroom(null)
    form.reset()
    setApiError(null)
    setIsAddModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading classrooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Classrooms Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage classrooms and their capacity</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Add Classroom
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search classrooms..." />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "capacity")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="name">Sort by Name</option>
          <option value="capacity">Sort by Capacity</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {sortOrder === "asc" ? "? Ascending" : "? Descending"}
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedClassrooms.length > 0 ? (
          paginatedClassrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{classroom.name}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Capacity</p>
                  <p className="text-xl font-bold text-primary">{classroom.capacity} seats</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleEdit(classroom)}
                    className="flex-1 text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(classroom)}
                    className="flex-1 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500">
            No classrooms found
          </div>
        )}
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
        title="Add New Classroom"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Classroom Name" 
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
            label="Capacity" 
            name="capacity" 
            type="number"
            value={form.values.capacity} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.capacity} 
            touched={form.touched.capacity}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Add Classroom
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
        title="Edit Classroom"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Classroom Name" 
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
            label="Capacity" 
            name="capacity" 
            type="number"
            value={form.values.capacity} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.capacity} 
            touched={form.touched.capacity}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Update Classroom
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
        title="Delete Classroom"
        description={`Are you sure you want to delete ${selectedClassroom?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
