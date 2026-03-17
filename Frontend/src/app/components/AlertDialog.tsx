import { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'

interface AlertDialogProps {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'default'
}

export default function AlertDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: AlertDialogProps) {
  if (!isOpen) return null

  const confirmButtonClass = variant === 'destructive'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-primary hover:bg-blue-700'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onCancel}></div>
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertCircle size={24} className={variant === 'destructive' ? 'text-red-600' : 'text-primary'} />
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600 text-sm mb-6">{description}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-colors font-medium ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
