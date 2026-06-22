import type { ToastItem } from '../../types'

interface ToastContainerProps {
  toasts: ToastItem[]
}

export default function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast pointer-events-auto px-4 py-3 rounded-xl text-sm shadow-lg border whitespace-pre-wrap ${
            t.type === 'success'
              ? 'bg-emerald-900/80 border-emerald-700 text-emerald-200'
              : t.type === 'error'
              ? 'bg-red-900/80 border-red-700 text-red-200'
              : 'bg-gray-800 border-gray-700 text-gray-200'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
