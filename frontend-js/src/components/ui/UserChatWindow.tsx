import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'

interface DMUser {
  id: number
  name: string
  email: string
}

interface DMessage {
  id: number
  body: string
  sender_id: number
  is_mine: boolean
  created_at: string
  date: string
}

interface UserChatWindowProps {
  peer: DMUser | null
  onClose: () => void
}

function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

export default function UserChatWindow({ peer, onClose }: UserChatWindowProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<DMessage[]>([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastIdRef = useRef<number>(0)

  const isOpen = peer !== null

  // Fetch messages
  const fetchMessages = useCallback(async (initial = false) => {
    if (!peer) return
    if (initial) setIsLoading(true)
    try {
      const res = await fetch(`/api/dm/${peer.id}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
      const data = await res.json()
      const msgs: DMessage[] = data.messages ?? []
      setMessages(msgs)
      if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id
    } catch {
      // silent
    } finally {
      if (initial) setIsLoading(false)
    }
  }, [peer])

  // Start / stop polling
  useEffect(() => {
    if (!peer) {
      setMessages([])
      setText('')
      lastIdRef.current = 0
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }
    fetchMessages(true)
    pollingRef.current = setInterval(() => fetchMessages(false), 3000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [peer, fetchMessages])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [text])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler as unknown as EventListener)
    return () => window.removeEventListener('keydown', handler as unknown as EventListener)
  }, [isOpen, onClose])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || isSending || !peer) return
    setIsSending(true)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    // Optimistic update
    const optimistic: DMessage = {
      id: Date.now(),
      body: trimmed,
      sender_id: user?.id ?? 0,
      is_mine: true,
      created_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: 'just now',
    }
    setMessages(prev => [...prev, optimistic])

    try {
      await fetch(`/api/dm/${peer.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ body: trimmed }),
      })
      // Refresh after send
      await fetchMessages(false)
    } catch {
      // revert optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
    } finally {
      setIsSending(false)
    }
  }, [text, isSending, peer, user, fetchMessages])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }, [])

  if (!peer) return null

  const peerColor = getAvatarColor(peer.name)
  const hasText = text.trim().length > 0

  // Group messages by date for date separators (simple version)
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Window — centered, full chat-like layout */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto flex flex-col bg-[#212121] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
          style={{ width: '700px', height: '85vh', maxHeight: '700px', animation: 'modalFadeIn 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────────────── */}
          <div className="flex items-center gap-3 px-5 py-4 bg-[#1a1a1a] border-b border-white/10 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
            >
              {getAvatarInitial(peer.name)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{peer.name}</h2>
              <p className="text-xs text-gray-500 truncate">{peer.email}</p>
            </div>

            {/* Online indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500">Active</span>
            </div>
          </div>

          {/* ── Messages ───────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full gap-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
                  style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
                >
                  {getAvatarInitial(peer.name)}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-200">{peer.name}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Say hi! This is the beginning of your conversation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg, i) => {
                  const showAvatar = !msg.is_mine && (i === 0 || messages[i - 1]?.is_mine !== false)
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2.5 ${msg.is_mine ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Peer avatar (only for first message in a group) */}
                      {!msg.is_mine ? (
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${showAvatar ? 'visible' : 'invisible'}`}
                          style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
                        >
                          {getAvatarInitial(peer.name)}
                        </div>
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )}

                      <div className={`flex flex-col gap-0.5 max-w-[65%] ${msg.is_mine ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed break-words ${
                            msg.is_mine
                              ? 'bg-white text-black rounded-br-sm'
                              : 'bg-[#2f2f2f] text-[#ececf1] rounded-bl-sm'
                          }`}
                        >
                          {msg.body}
                        </div>
                        <span className="text-[10px] text-gray-600 px-1">{msg.created_at}</span>
                      </div>
                    </div>
                  )
                })}
                {/* Typing / polling indicator */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input ──────────────────────────────────────────── */}
          <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-[#212121] border-t border-white/10">
            <div className="relative bg-[#2f2f2f] rounded-[22px] flex items-end pr-2 pb-1.5 pt-1.5 pl-4">
              <textarea
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${peer.name}...`}
                className="w-full bg-transparent text-[#ececf1] placeholder-gray-500 text-[14px] px-2 py-2 resize-none outline-none leading-relaxed max-h-[160px]"
              />
              <button
                onClick={handleSend}
                disabled={!hasText || isSending}
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-all mb-1 ${
                  hasText && !isSending
                    ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                    : 'bg-[#676767] text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-center text-[11px] text-gray-600 mt-2 select-none">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
