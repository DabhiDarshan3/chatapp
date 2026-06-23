import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'

export interface DMPeer {
  id: number
  name: string
  email: string
}

interface DMessage {
  id: number
  body: string
  sender_id: number
  is_mine: boolean
  is_ai: boolean
  attachments?: any[]
  read_at?: string | null
  created_at: string
}

const EMOJIS = ['😀','😂','🥺','😍','🥰','😎','🤔','👍','🙏','🔥','✨','❤️','🎉','💔','💯']

interface DMChatViewProps {
  peer: DMPeer
  onClose: () => void
}

function getCsrf(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''
}

const GPT_PATTERN = /@gpt\b/i

export default function DMChatView({ peer, onClose }: DMChatViewProps) {
  const { user } = useAuth()

  const [messages, setMessages] = useState<DMessage[]>([])
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const [isGifOpen, setIsGifOpen] = useState(false)
  const [gifSearch, setGifSearch] = useState('')
  const [gifs, setGifs] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const peerColor = getAvatarColor(peer.name)
  const myColor = user ? getAvatarColor(user.name) : { bg: '#555', text: '#fff' }

  // ── Fetch messages ─────────────────────────────────────────────
  const fetchMessages = useCallback(async (initial = false) => {
    if (initial) setIsLoading(true)
    try {
      const res = await fetch(`/api/dm/${peer.id}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch {
      //
    } finally {
      if (initial) setIsLoading(false)
    }
  }, [peer.id])

  // ── Start polling ──────────────────────────────────────────────
  useEffect(() => {
    fetchMessages(true)
    pollingRef.current = setInterval(() => fetchMessages(false), 3000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [fetchMessages])

  // ── Scroll to bottom ───────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  // ── Giphy API ──────────────────────────────────────────────────
  const searchGifs = useCallback(async (q: string) => {
    const endpoint = q 
      ? `https://api.giphy.com/v1/gifs/search?api_key=GlVGYHqc3SyXXTzxR083whz4zqniR0pX&q=${encodeURIComponent(q)}&limit=20`
      : `https://api.giphy.com/v1/gifs/trending?api_key=GlVGYHqc3SyXXTzxR083whz4zqniR0pX&limit=20`
    try {
      const res = await fetch(endpoint)
      const data = await res.json()
      setGifs(data.data.map((g: any) => g.images.fixed_height.url))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (isGifOpen) searchGifs(gifSearch)
  }, [isGifOpen, gifSearch, searchGifs])

  // ── Auto-resize textarea ───────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [text])

  // ── Send message ───────────────────────────────────────────────
  const handleSend = useCallback(async (attachment?: any) => {
    const trimmed = text.trim()
    if ((!trimmed && !attachment) || isSending) return
    setIsSending(true)
    setText('')
    setIsEmojiOpen(false)
    setIsGifOpen(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const hasGpt = GPT_PATTERN.test(trimmed)
    const attachmentsPayload = attachment ? [attachment] : undefined

    // Optimistic insert
    const optimistic: DMessage = {
      id: Date.now(),
      body: trimmed,
      sender_id: user?.id ?? 0,
      is_mine: true,
      is_ai: false,
      attachments: attachmentsPayload,
      read_at: null,
      created_at: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      // 1. Store DM
      await fetch(`/api/dm/${peer.id}`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-TOKEN': getCsrf(),
        },
        body: JSON.stringify({ body: trimmed, attachments: attachmentsPayload }),
      })

      // 2. If @gpt detected — call AI endpoint
      if (hasGpt) {
        setIsAiThinking(true)
        const history = messages.slice(-10).map(m => ({ body: m.body, is_mine: m.is_mine }))
        await fetch(`/api/dm/${peer.id}/gpt`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrf(),
          },
          body: JSON.stringify({ prompt: trimmed, history }),
        })
        setIsAiThinking(false)
      }

      await fetchMessages(false)
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      setIsAiThinking(false)
    } finally {
      setIsSending(false)
    }
  }, [text, isSending, peer.id, user, messages, fetchMessages])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }, [])

  const hasText = text.trim().length > 0

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

      {/* ── DM Header (replaces normal Header) ── */}
      <header className="flex items-center gap-3 px-4 py-3 flex-shrink-0 bg-[#212121] border-b border-white/10">
        {/* Back button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2f2f2f] transition-colors flex-shrink-0"
          title="Back to chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Peer avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
        >
          {getAvatarInitial(peer.name)}
        </div>

        {/* Peer info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-gray-200 truncate">{peer.name}</h1>
          <p className="text-xs text-gray-500 truncate">{peer.email}</p>
        </div>

        {/* Online dot */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500 hidden sm:block">Active</span>
        </div>

        {/* Hint badge */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-[#2f2f2f] text-[11px] text-gray-500">
          <span>Type</span>
          <code className="text-blue-400 font-mono">@gpt</code>
          <span>for AI reply</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full gap-3">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
            <span className="text-sm text-gray-500">Loading...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl"
              style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
            >
              {getAvatarInitial(peer.name)}
            </div>
            <div>
              <p className="text-base font-semibold text-gray-200">{peer.name}</p>
              <p className="text-sm text-gray-500 mt-1">Say hi! This is the beginning of your conversation.</p>
              <p className="text-xs text-gray-600 mt-1">Use <code className="text-blue-400">@gpt</code> in any message to get an AI response.</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((msg, i) => {
              // AI message — same style as AI chat (left aligned, plain text)
              if (msg.is_ai) {
                return (
                  <div key={msg.id} className="flex items-start gap-3 group">
                    {/* GPT logo circle */}
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 41 41" fill="none">
                        <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.313-2.635 10.078 10.078 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.313 2.634 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813Z" fill="#111"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1 font-medium">GPT</p>
                      <p className="text-[15px] text-[#ececf1] leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                      <span className="text-[10px] text-gray-600 mt-1 block">{msg.created_at}</span>
                    </div>
                  </div>
                )
              }

              // My message — right side with my avatar
              if (msg.is_mine) {
                const showAvatar = i === 0 || !messages[i - 1]?.is_mine
                return (
                  <div key={msg.id} className="flex items-end gap-2.5 flex-row-reverse">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${showAvatar ? '' : 'opacity-0'}`}
                      style={{ backgroundColor: myColor.bg, color: myColor.text }}>
                      {user ? getAvatarInitial(user.name) : '?'}
                    </div>
                    <div className="flex flex-col items-end gap-0.5 max-w-[65%]">
                      <div className="bg-[#2f2f2f] text-[#ececf1] px-4 py-2.5 rounded-2xl rounded-br-sm text-[15px] leading-relaxed break-words">
                        {msg.attachments?.map((att, idx) => {
                          if (att.type === 'image_url' && att.image_url?.url) {
                            return <img key={idx} src={att.image_url.url} alt="attachment" className="max-w-full rounded-lg mb-2 max-h-64 object-contain" />
                          }
                          return null
                        })}
                        {/* highlight @gpt */}
                        {msg.body && renderBody(msg.body)}
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-[10px] text-gray-600">{msg.created_at}</span>
                        <div className="flex-shrink-0">
                          {msg.read_at ? (
                            <svg className="w-[14px] h-[14px] text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L7 17l-5-5"/><path d="M22 10l-7.5 7.5L13 16"/>
                            </svg>
                          ) : (
                            <svg className="w-[14px] h-[14px] text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              // Peer message — left side with peer avatar
              const showPeerAvatar = i === 0 || messages[i - 1]?.is_mine !== false || messages[i - 1]?.is_ai
              return (
                <div key={msg.id} className="flex items-end gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${showPeerAvatar ? '' : 'opacity-0'}`}
                    style={{ backgroundColor: peerColor.bg, color: peerColor.text }}
                  >
                    {getAvatarInitial(peer.name)}
                  </div>
                  <div className="flex flex-col items-start gap-0.5 max-w-[65%]">
                    <div className="bg-[#383838] text-[#ececf1] px-4 py-2.5 rounded-2xl rounded-bl-sm text-[15px] leading-relaxed break-words">
                      {msg.attachments?.map((att, idx) => {
                        if (att.type === 'image_url' && att.image_url?.url) {
                          return <img key={idx} src={att.image_url.url} alt="attachment" className="max-w-full rounded-lg mb-2 max-h-64 object-contain" />
                        }
                        return null
                      })}
                      {msg.body && msg.body}
                    </div>
                    <span className="text-[10px] text-gray-600 px-1">{msg.created_at}</span>
                  </div>
                </div>
              )
            })}

            {/* AI thinking indicator */}
            {isAiThinking && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 41 41" fill="none">
                    <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.313-2.635 10.078 10.078 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.313 2.634 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813Z" fill="#111"/>
                  </svg>
                </div>
                <div className="flex gap-1 pt-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input (same style as AI chat) ── */}
      <div className="flex-shrink-0 bg-transparent px-4 pb-4 w-full">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-[#2f2f2f] rounded-[26px] flex items-end pr-2 pb-1.5 pt-1.5 pl-3">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${peer.name}… (use @gpt for AI reply)`}
              className="w-full bg-transparent text-[#ececf1] placeholder-gray-400 text-[15px] px-3 py-2.5 resize-none outline-none leading-relaxed max-h-[180px]"
            />
            <div className="flex items-center gap-1 mb-1 mr-1 relative">
              {/* Emoji Picker Dropdown */}
              {isEmojiOpen && (
                <div className="absolute bottom-12 right-0 bg-[#212121] border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-wrap gap-2 w-64 z-50" style={{ animation: 'fadeSlideUp 0.2s ease-out' }}>
                  {EMOJIS.map(em => (
                    <button
                      key={em}
                      onClick={() => { setText(prev => prev + em); setIsEmojiOpen(false); textareaRef.current?.focus() }}
                      className="text-xl hover:scale-125 transition-transform hover:bg-white/5 w-8 h-8 rounded-full flex items-center justify-center"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
              {/* GIF Modal */}
              {isGifOpen && (
                <div className="absolute bottom-12 right-0 bg-[#212121] border border-white/10 rounded-2xl shadow-2xl w-72 h-80 flex flex-col z-50 overflow-hidden" style={{ animation: 'fadeSlideUp 0.2s ease-out' }}>
                  <div className="p-2 border-b border-white/10">
                    <input
                      type="text"
                      placeholder="Search GIFs..."
                      value={gifSearch}
                      onChange={(e) => setGifSearch(e.target.value)}
                      className="w-full bg-[#111] text-white text-sm px-3 py-2 rounded-lg outline-none border border-white/10 focus:border-white/30 transition-colors"
                      autoFocus
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2">
                    {gifs.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt="GIF"
                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleSend({ type: 'image_url', image_url: { url } })}
                      />
                    ))}
                  </div>
                </div>
              )}
              {/* GIF Button */}
              <button
                onClick={() => { setIsGifOpen(!isGifOpen); setIsEmojiOpen(false); }}
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full font-bold text-[10px] transition-colors ${isGifOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Send GIF"
              >
                GIF
              </button>
              {/* Image Upload Button */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => handleSend({ type: 'image_url', image_url: { url: ev.target?.result as string } })
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Send Photo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* Emoji Button */}
              <button
                onClick={() => { setIsEmojiOpen(!isEmojiOpen); setIsGifOpen(false); }}
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${isEmojiOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                title="Add emoji"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              
              <button
                onClick={() => handleSend()}
                disabled={!hasText || isSending}
                className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors
                  ${hasText && !isSending
                    ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                    : 'bg-[#676767] text-gray-300 cursor-not-allowed'}`}
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
          </div>
          <p className="text-center text-[11px] text-gray-500 mt-2 select-none">
            Enter to send · Shift+Enter for new line · <span className="text-blue-400/70">@gpt</span> for AI
          </p>
        </div>
      </div>
    </div>
  )
}

// Highlight @gpt in message text
function renderBody(body: string) {
  const parts = body.split(/(@gpt\b)/gi)
  return (
    <span>
      {parts.map((part, i) =>
        /^@gpt$/i.test(part)
          ? <span key={i} className="text-blue-400 font-semibold">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}
