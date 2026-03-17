import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormInput from '../components/FormInput'
import { useForm } from '../../hooks/useForm'
import { validateRegister } from '../../utils/validation'

export default function Register() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const form = useForm(
    { name: '', email: '', password: '', confirmPassword: '' },
    async (values) => {
      const errors = validateRegister(values)
      if (Object.keys(errors).length === 0) {
        setIsLoading(true)
        setServerError('')
        try {
          // TODO: Replace with actual API call
          // const response = await authAPI.register(values)
          console.log('Registering:', values)
          setTimeout(() => {
            navigate('/login')
          }, 500)
        } catch (error: any) {
          setServerError(error.response?.data?.message || 'Registration failed')
        } finally {
          setIsLoading(false)
        }
      } else {
        form.setErrors(errors)
      }
    }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Smart Classroom</h1>
          <p className="text-gray-600 mb-8">Create Account</p>

          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{serverError}</p>
            </div>
          )}

          <form onSubmit={form.handleSubmit} className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              placeholder="John Doe"
              value={form.values.name}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.name}
              touched={form.touched.name}
              required
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.email}
              touched={form.touched.email}
              required
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.password}
              touched={form.touched.password}
              required
            />
            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.values.confirmPassword}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.confirmPassword}
              touched={form.touched.confirmPassword}
              required
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
