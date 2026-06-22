import { useChatContext } from './context/ChatContext'
import { useAuth } from './context/AuthContext'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MessageList from './components/chat/MessageList'
import ChatInput from './components/chat/ChatInput'
import ToastContainer from './components/ui/Toast'
import AuthModal from './components/ui/AuthModal'
import DMChatView from './components/ui/DMChatView'
import NotificationBadge from './components/ui/NotificationBadge'
import { useNotifications, type UnreadMessage } from './hooks/useNotifications'

interface DMPeer { id: number; name: string; email: string }

export default function App() {
  const { isLoading: authLoading } = useAuth()

  const {
    messages,
    isStreaming,
    streamingText,
    streamingError,
    sendMessage,
    regenerate,
    toasts,
    isTemporaryChat,
    temporaryMessages,
  } = useChatContext()

  const activeMessages = isTemporaryChat ? temporaryMessages : messages
  const showBottomInput = activeMessages.length > 0 || isStreaming

  // ── DM Chat state ─────────────────────────────────────────────
  const [dmPeer, setDmPeer] = useState<DMPeer | null>(null)

  // Listen for "open-user-chat" event from UsersPanel / NotificationBadge
  useEffect(() => {
    const handler = (e: Event) => {
      const peer = (e as CustomEvent).detail as DMPeer
      if (peer) {
        setDmPeer(peer)
        setNotifications(prev => prev.filter(m => m.sender_id !== peer.id))
      }
    }
    window.addEventListener('open-user-chat', handler)
    return () => window.removeEventListener('open-user-chat', handler)
  }, [])

  // ── Notifications state ───────────────────────────────────────
  const [notifications, setNotifications] = useState<UnreadMessage[]>([])

  const handleNewMessage = useCallback((msg: UnreadMessage) => {
    setNotifications(prev => {
      if (prev.some(m => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const handleClearSender = useCallback((senderId: number) => {
    setNotifications(prev => prev.filter(m => m.sender_id !== senderId))
  }, [])

  const handleOpenFromNotif = useCallback((senderId: number, name: string, email: string) => {
    setDmPeer({ id: senderId, name, email })
    setNotifications(prev => prev.filter(m => m.sender_id !== senderId))
  }, [])

  useNotifications(dmPeer?.id ?? null, handleNewMessage)

  // Clear notifications when DM chat is opened
  useEffect(() => {
    if (dmPeer) {
      setNotifications(prev => prev.filter(m => m.sender_id !== dmPeer.id))
    }
  }, [dmPeer])

  // ── Auth loading screen ───────────────────────────────────────
  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-[#212121] flex flex-col items-center justify-center gap-5">
        <svg width="44" height="44" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white opacity-90">
          <path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835 9.964 9.964 0 0 0-6.313-2.635 10.078 10.078 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 6.313 2.634 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813Z" fill="currentColor"/>
        </svg>
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden text-[#ececf1] bg-[#212121]">
      {/* Sidebar — always visible */}
      <Sidebar />

      {/* Main Area — switches between AI chat and DM view */}
      {dmPeer ? (
        // ── User-to-User DM — inline, same layout as AI chat ──
        <DMChatView
          peer={dmPeer}
          onClose={() => setDmPeer(null)}
        />
      ) : (
        // ── Normal AI Chat ──────────────────────────────────────
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header />

          <MessageList
            messages={activeMessages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamingError={streamingError}
            onSuggestion={sendMessage}
            onRegenerate={regenerate}
            onSend={sendMessage}
          />

          {showBottomInput && (
            <div className="mx-auto w-full max-w-3xl px-4">
              <ChatInput
                onSend={sendMessage}
                disabled={isStreaming}
              />
            </div>
          )}
        </main>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />

      {/* Auth Modal */}
      <AuthModal />

      {/* DM Notification Badge (floating bell) */}
      <NotificationBadge
        notifications={notifications}
        onOpen={handleOpenFromNotif}
        onClear={handleClearSender}
      />
    </div>
  )
}
