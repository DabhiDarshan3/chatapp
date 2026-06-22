import { useState, useCallback, useEffect } from 'react'
import type { UnreadMessage } from '../../hooks/useNotifications'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'

interface NotificationBadgeProps {
  notifications: UnreadMessage[]
  onOpen: (senderId: number, senderName: string, senderEmail: string) => void
  onClear: (senderId: number) => void
}

export default function NotificationBadge({ notifications, onOpen, onClear }: NotificationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  // Group by sender
  const grouped = notifications.reduce<Record<number, { name: string; email: string; count: number; latest: string }>>((acc, msg) => {
    if (!acc[msg.sender_id]) {
      acc[msg.sender_id] = { name: msg.sender_name, email: msg.sender_email, count: 0, latest: '' }
    }
    acc[msg.sender_id].count++
    acc[msg.sender_id].latest = msg.body
    return acc
  }, {})

  const totalCount = notifications.length
  const senders = Object.entries(grouped)

  // Show badge when new notifications arrive
  useEffect(() => {
    if (totalCount > 0) setVisible(true)
  }, [totalCount])

  const handleOpen = useCallback((senderId: number, name: string, email: string) => {
    setIsOpen(false)
    onOpen(senderId, name, email)
    onClear(senderId)
  }, [onOpen, onClear])

  if (!visible || totalCount === 0) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
      )}

      {/* Floating button + dropdown */}
      <div className="fixed bottom-6 right-6 z-[70]">
        {/* Dropdown panel */}
        {isOpen && (
          <div
            className="absolute bottom-14 right-0 w-80 bg-[#1e1e1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            style={{ animation: 'fadeSlideUp 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm font-semibold text-white">New Messages</span>
              </div>
              <span className="text-xs text-gray-500">{totalCount} unread</span>
            </div>

            {/* Sender list */}
            <div className="max-h-64 overflow-y-auto">
              {senders.map(([idStr, info]) => {
                const id = Number(idStr)
                const color = getAvatarColor(info.name)
                return (
                  <button
                    key={id}
                    onClick={() => handleOpen(id, info.name, info.email)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{ backgroundColor: color.bg, color: color.text }}
                      >
                        {getAvatarInitial(info.name)}
                      </div>
                      {/* Unread count badge */}
                      {info.count > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">{info.count > 9 ? '9+' : info.count}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{info.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {info.latest.length > 40 ? info.latest.slice(0, 37) + '...' : info.latest}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Floating bell button */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="relative w-12 h-12 bg-blue-600 hover:bg-blue-500 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
          title="New messages"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>

          {/* Red count badge */}
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 shadow-md">
            <span className="text-[10px] font-bold text-white">{totalCount > 99 ? '99+' : totalCount}</span>
          </div>

          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-25 pointer-events-none" />
        </button>
      </div>
    </>
  )
}
