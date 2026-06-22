import { useEffect, useState, useRef } from 'react'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'

interface AppUser {
  id: number
  name: string
  email: string
  joined: string
}

interface UsersPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function UsersPanel({ isOpen, onClose }: UsersPanelProps) {
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setIsLoading(true)
    setError('')
    fetch('/api/users', { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setUsers(data.users ?? []))
      .catch(() => setError('Could not load users.'))
      .finally(() => setIsLoading(false))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenChat = (u: AppUser) => {
    onClose()
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-user-chat', { detail: u }))
    }, 220)
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full z-50 flex flex-col bg-[#1a1a1a] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: '340px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2f2f2f] flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">All Users</h2>
              <p className="text-xs text-gray-500">{users.length} registered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-[#2f2f2f] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#2f2f2f] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">Loading users...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
              <svg className="w-8 h-8 text-red-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-500">
                {search ? 'No users match your search.' : 'No other users found.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 mt-1">
              {filtered.map(u => {
                const color = getAvatarColor(u.name)
                return (
                  <button
                    key={u.id}
                    onClick={() => handleOpenChat(u)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#2a2a2a] transition-colors group text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md"
                      style={{ backgroundColor: color.bg, color: color.text }}
                    >
                      {getAvatarInitial(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{u.name}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors whitespace-nowrap hidden group-hover:hidden">
                        {u.joined}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {!isLoading && !error && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-white/10 flex-shrink-0">
            <p className="text-xs text-gray-600 text-center">
              {search ? `${filtered.length} of ${users.length} users` : `${users.length} user${users.length !== 1 ? 's' : ''} total`}
            </p>
            <p className="text-xs text-gray-600 text-center mt-0.5">Click a user to start chatting</p>
          </div>
        )}
      </div>
    </>
  )
}
