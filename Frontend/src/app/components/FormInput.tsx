import { useState } from 'react'

interface FormInputProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  error?: string
  touched?: boolean
  required?: boolean
  options?: { label: string; value: string }[]
  multiple?: boolean
  textarea?: boolean
}

export default function FormInput({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required,
  options,
  multiple,
  textarea,
}: FormInputProps) {
  const hasError = touched && error

  const baseClasses = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors'
  const errorClasses = hasError ? 'border-red-500 bg-red-50' : 'border-gray-300'

  if (textarea) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
        <textarea
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${baseClasses} ${errorClasses} resize-none`}
          rows={4}
        />
        {hasError && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    )
  }

  if (options) {
    return (
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`${baseClasses} ${errorClasses}`}
          multiple={multiple}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hasError && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`${baseClasses} ${errorClasses}`}
      />
      {hasError && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
}
