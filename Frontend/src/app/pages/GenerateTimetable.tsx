import { useState } from 'react'
import { useForm } from '../../hooks/useForm'
import FormInput from '../components/FormInput'
import AlertDialog from '../components/AlertDialog'

export default function GenerateTimetable() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedTimetable, setGeneratedTimetable] = useState<{ class: string; semester: string } | null>(null)

  const classOptions = [
    { label: 'CS-A', value: 'CS-A' },
    { label: 'CS-B', value: 'CS-B' },
    { label: 'IT-A', value: 'IT-A' },
    { label: 'IT-B', value: 'IT-B' },
    { label: 'ME-A', value: 'ME-A' },
    { label: 'EC-B', value: 'EC-B' },
  ]

  const semesterOptions = [
    { label: '1st Sem', value: '1st Sem' },
    { label: '2nd Sem', value: '2nd Sem' },
    { label: '3rd Sem', value: '3rd Sem' },
    { label: '4th Sem', value: '4th Sem' },
    { label: '5th Sem', value: '5th Sem' },
    { label: '6th Sem', value: '6th Sem' },
    { label: '7th Sem', value: '7th Sem' },
    { label: '8th Sem', value: '8th Sem' },
  ]

  const form = useForm(
    { class: 'CS-A', semester: '6th Sem' },
    async (values) => {
      setIsGenerating(true)
      try {
        // TODO: Replace with actual API call
        // const response = await timetableAPI.generate(values)
        console.log('Generating timetable:', values)
        const result = await new Promise(resolve => 
          setTimeout(() => resolve({ class: values.class, semester: values.semester }), 2000)
        )
        setGeneratedTimetable(result as { class: string; semester: string })
        setShowSuccess(true)
      } catch (error) {
        console.error('Failed to generate timetable')
      } finally {
        setIsGenerating(false)
      }
    }
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Generate Timetable</h2>
        <p className="text-gray-600 text-sm mt-1">Generate optimized timetables using constraint-based scheduling</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Configuration</h3>
        
        <form onSubmit={form.handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Class"
              name="class"
              value={form.values.class}
              onChange={form.handleChange}
              options={classOptions}
            />
            <FormInput
              label="Semester"
              name="semester"
              value={form.values.semester}
              onChange={form.handleChange}
              options={semesterOptions}
            />
          </div>

          <button 
            type="submit"
            disabled={isGenerating}
            className="w-full bg-primary text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📅</span>
            {isGenerating ? 'Generating...' : 'Generate Timetable'}
          </button>
        </form>
      </div>

      {/* Algorithm Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">How it works</h4>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>✓ Uses constraint satisfaction algorithms to generate optimal schedules</li>
          <li>✓ Considers faculty availability and teaching constraints</li>
          <li>✓ Ensures no classroom conflicts or overbooking</li>
          <li>✓ Optimizes for minimal gaps and balanced workload</li>
          <li>✓ Prevents faculty from having back-to-back classes</li>
          <li>✓ Respects maximum classes per day constraints</li>
        </ul>
      </div>

      {/* Success Dialog */}
      <AlertDialog
        isOpen={showSuccess}
        title="Timetable Generated Successfully!"
        description={`Timetable for ${generatedTimetable?.class} (${generatedTimetable?.semester}) has been generated. You can now view it in the View Timetable section.`}
        onConfirm={() => {
          setShowSuccess(false)
          window.location.href = '/view-timetable'
        }}
        onCancel={() => setShowSuccess(false)}
        confirmText="View Timetable"
        cancelText="Close"
      />
    </div>
  )
}
