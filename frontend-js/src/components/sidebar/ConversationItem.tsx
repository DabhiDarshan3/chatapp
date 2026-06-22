import { useState, useRef, useEffect } from 'react'
import type { Conversation } from '../../types'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: (conv: Conversation) => void
  onDelete: (id: number) => void
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
}: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div
      className={`group relative rounded-lg mb-0.5 cursor-pointer flex items-center justify-between px-2.5 py-2
                  transition-colors ${isActive ? 'bg-[#2f2f2f]' : 'hover:bg-[#202123]'}`}
      onClick={() => onClick(conversation)}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className={`text-[13px] truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white transition-colors'}`}>
          {conversation.title}
        </p>
      </div>

      {/* Hover/Active Actions */}
      <div className={`absolute right-2 flex items-center gap-1 bg-gradient-to-l from-[#2f2f2f] via-[#2f2f2f] to-transparent pl-4
                      ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:from-[#202123] group-hover:via-[#202123]'} transition-opacity`}>
        
        <button
          className="p-1 rounded-md text-gray-400 hover:text-white transition-colors"
          title="Pin"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-1 rounded-md text-gray-400 hover:text-white transition-colors"
            title="More"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#2f2f2f] border border-gray-700/50 rounded-xl shadow-xl z-50 py-1.5 font-medium text-[13px] text-gray-200">
              <button className="w-full text-left px-3 py-2 hover:bg-[#40414f] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Share
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#40414f] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start a group chat
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#40414f] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Rename
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#40414f] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Pin chat
              </button>
              <button className="w-full text-left px-3 py-2 hover:bg-[#40414f] flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                Archive
              </button>
              <div className="h-px bg-gray-700/50 my-1"></div>
              <button
                className="w-full text-left px-3 py-2 hover:bg-[#40414f] text-red-500 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete(conversation.id)
                }}
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
