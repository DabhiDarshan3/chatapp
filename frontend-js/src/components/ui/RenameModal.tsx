import { useState, useEffect, useRef } from 'react'

interface RenameModalProps {
  currentTitle: string
  onSave: (title: string) => void
  onClose: () => void
}

export default function RenameModal({ currentTitle, onSave, onClose }: RenameModalProps) {
  const [title, setTitle] = useState(currentTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (trimmed) onSave(trimmed)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-white mb-4">Rename Chat</h3>
        <input
          ref={inputRef}
          type="text"
          maxLength={100}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="rename-input w-full bg-gray-800 border border-gray-700 text-gray-200
                     text-sm rounded-xl px-4 py-3 mb-4 transition-colors"
          placeholder="Enter new title…"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white
                       hover:bg-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
