import { useState, useEffect, useRef } from 'react'
import type { Conversation } from '../../types'
import { useChatContext } from '../../context/ChatContext'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const { setActiveConversation } = useChatContext()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const fetchResults = async () => {
      setLoading(true)
      try {
        const url = query.trim() 
          ? `/api/conversations?search=${encodeURIComponent(query)}`
          : `/api/conversations`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        setResults(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    const delayDebounceFn = setTimeout(() => {
      fetchResults()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query, isOpen])

  if (!isOpen) return null

  const handleSelect = (conv: Conversation) => {
    setActiveConversation(conv)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#202123] rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header / Input */}
        <div className="flex items-center p-4 border-b border-gray-700/50">
          <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-lg"
            placeholder="Search chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-between group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium truncate">{conv.title}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  {conv.model_label && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-3">
                      {conv.model_label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
