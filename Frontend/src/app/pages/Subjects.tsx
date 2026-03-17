import { useState, useEffect } from "react"
import { Edit2, Trash2, Plus } from "lucide-react"
import Modal from "../components/Modal"
import AlertDialog from "../components/AlertDialog"
import FormInput from "../components/FormInput"
import SearchBar from "../components/SearchBar"
import Pagination from "../components/Pagination"
import { useForm, usePagination, useSearch } from "../../hooks/useForm"
import { validateSubject } from "../../utils/validation"
import { subjectAPI, facultyAPI } from "../../services/api"

interface Subject {
  id: number
  name: string
  classes_per_week: number
  faculty_id: number
  faculty?: { id: number; name: string }
}

interface Faculty {
  id: number
  name: string
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [faculties, setFaculties] = useState<Faculty[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [sortBy, setSortBy] = useState<"name" | "classes_per_week">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [subjectsRes, facultiesRes] = await Promise.all([
        subjectAPI.getAll(),
        facultyAPI.getAll()
      ])
      setSubjects(subjectsRes.data.data || [])
      setFaculties(facultiesRes.data.data || [])
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to fetch data"
      setError(errorMsg)
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const { searchTerm, setSearchTerm, filteredItems } = useSearch(subjects, "name")
  
  const sortedSubjects = [...filteredItems].sort((a, b) => {
    let aValue = sortBy === "name" ? a.name : a.classes_per_week
    let bValue = sortBy === "name" ? b.name : b.classes_per_week
    
    if (typeof aValue === "string") {
      return sortOrder === "asc" ? aValue.localeCompare(bValue as string) : (bValue as string).localeCompare(aValue)
    }
    return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const { currentPage, totalPages, startIndex, endIndex, goToPage } = usePagination(sortedSubjects.length, 5)
  const paginatedSubjects = sortedSubjects.slice(startIndex, endIndex)

  const form = useForm(
    { name: "", classesPerWeek: "", facultyId: "" },
    async (values) => {
      const validationErrors = validateSubject({
        name: values.name,
        classes_per_week: parseInt(values.classesPerWeek),
        faculty_id: parseInt(values.facultyId)
      })
      
      if (Object.keys(validationErrors).length === 0) {
        try {
          setApiError(null)
          const payload = {
            name: values.name,
            classes_per_week: parseInt(values.classesPerWeek),
            faculty_id: parseInt(values.facultyId)
          }
          
          if (selectedSubject) {
            await subjectAPI.update(selectedSubject.id, payload)
          } else {
            await subjectAPI.create(payload)
          }
          
          await fetchData()
          setIsEditModalOpen(false)
          setIsAddModalOpen(false)
          form.reset()
          setSelectedSubject(null)
        } catch (err: any) {
          const errorMsg = err.response?.data?.message || "Failed to save subject"
          setApiError(errorMsg)
          console.error("Error saving subject:", err)
        }
      } else {
        form.setErrors(validationErrors)
      }
    }
  )

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject)
    form.setValues({
      name: subject.name,
      classesPerWeek: subject.classes_per_week.toString(),
      facultyId: subject.faculty_id.toString()
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedSubject) {
      try {
        setApiError(null)
        await subjectAPI.delete(selectedSubject.id)
        await fetchData()
        setIsDeleteDialogOpen(false)
        setSelectedSubject(null)
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Failed to delete subject"
        setApiError(errorMsg)
        console.error("Error deleting subject:", err)
      }
    }
  }

  const handleOpenAdd = () => {
    setSelectedSubject(null)
    form.reset()
    setApiError(null)
    setIsAddModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subjects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subjects Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage courses and their faculty assignments</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={20} />
          Add Subject
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Search and Sort */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} placeholder="Search subjects..." />
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "name" | "classes_per_week")}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="name">Sort by Name</option>
          <option value="classes_per_week">Sort by Classes/Week</option>
        </select>
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          {sortOrder === "asc" ? "? Ascending" : "? Descending"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Faculty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Classes/Week</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubjects.length > 0 ? (
                paginatedSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{subject.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {subject.faculty?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{subject.classes_per_week}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleEdit(subject)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(subject)}
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
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No subjects found
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
        title="Add New Subject"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Subject Name" 
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
            label="Faculty" 
            name="facultyId" 
            type="select"
            value={form.values.facultyId}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.faculty_id}
            touched={form.touched.facultyId}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id.toString()}>{f.name}</option>
            ))}
          </FormInput>
          <FormInput 
            label="Classes Per Week" 
            name="classesPerWeek" 
            type="number"
            value={form.values.classesPerWeek} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.classes_per_week} 
            touched={form.touched.classesPerWeek}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Add Subject
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
        title="Edit Subject"
      >
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm mb-4">
            {apiError}
          </div>
        )}
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <FormInput 
            label="Subject Name" 
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
            label="Faculty" 
            name="facultyId" 
            type="select"
            value={form.values.facultyId}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.faculty_id}
            touched={form.touched.facultyId}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id.toString()}>{f.name}</option>
            ))}
          </FormInput>
          <FormInput 
            label="Classes Per Week" 
            name="classesPerWeek" 
            type="number"
            value={form.values.classesPerWeek} 
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.classes_per_week} 
            touched={form.touched.classesPerWeek}
            required
          />
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Update Subject
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
        title="Delete Subject"
        description={`Are you sure you want to delete ${selectedSubject?.name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
