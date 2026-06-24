import { useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { useAuth } from '../../context/AuthContext'
import RenameModal from '../ui/RenameModal'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'

export default function Header() {
  const {
    activeConversation,
    sidebarOpen,
    toggleSidebar,
    handleRenameConversation,
    addToast,
    isTemporaryChat,
    toggleTemporaryChat,
  } = useChatContext()

  const { user, openAuthModal, logout } = useAuth()

  const [renameOpen, setRenameOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleRenameSave = (title: string) => {
    if (activeConversation) {
      handleRenameConversation(activeConversation.id, title)
    }
    setRenameOpen(false)
  }

  const handleShare = async () => {
    if (!activeConversation || isTemporaryChat) return
    const url = `${window.location.origin}${window.location.pathname}?c=${activeConversation.id}`
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url)
      } else {
        // Fallback for HTTP environments where navigator.clipboard is undefined
        const textArea = document.createElement("textarea")
        textArea.value = url
        textArea.style.position = "absolute"
        textArea.style.opacity = "0"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!successful) throw new Error('Fallback copy failed')
      }
      addToast('Public link copied to your clipboard\nAnyone with this link can see this conversation', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to copy link', 'error')
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-4 py-3 flex-shrink-0 bg-[#212121]">
        <div className="flex items-center gap-3">
          {/* Show sidebar button (when collapsed) */}
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className={`flex items-center gap-2 group w-fit max-w-full ${!isTemporaryChat ? 'cursor-pointer hover:bg-[#2f2f2f]' : ''} px-3 py-1.5 rounded-lg transition-colors`} onClick={() => !isTemporaryChat && setRenameOpen(true)}>
            <h1 className="text-lg font-semibold text-gray-200 truncate max-w-xs">
              {isTemporaryChat ? 'Temporary Chat' : (activeConversation ? activeConversation.title : 'ChatGPT')}
            </h1>
            {!isTemporaryChat && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            /* Logged-in user controls */
            <>
              <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#2f2f2f] transition-colors text-sm font-medium text-gray-200 border border-gray-600/50 mr-1">
                <span>✨</span>
                <span>Upgrade</span>
              </button>

              <button
                onClick={toggleTemporaryChat}
                className={`flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors ${
                  isTemporaryChat
                    ? 'bg-[#2f2f2f] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-[#2f2f2f]'
                }`}
                aria-label="Turn on temporary chat"
                title="Temporary Chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" aria-hidden="true" className="icon">
                  <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" strokeDasharray="4 6" d="M12 21a9 9 0 0 1-5.75-2.06l-3.3 1.1 1.1-3.3A9 9 0 1 1 12 21Z" />
                </svg>
              </button>

              {activeConversation && !isTemporaryChat && (
                <>
                  <button onClick={handleShare} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors text-sm font-medium text-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Share</span>
                  </button>
                </>
              )}

              {/* User avatar dropdown */}
              <div className="relative">
              <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: getAvatarColor(user.name).bg, color: getAvatarColor(user.name).text }}
                  title={user.name}
                >
                  {getAvatarInitial(user.name)}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-52 rounded-xl bg-[#2f2f2f] border border-white/10 shadow-2xl z-50 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest controls */
            <>
              <button
                onClick={openAuthModal}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white bg-[#2f2f2f] hover:bg-[#404040] border border-white/10 transition-colors whitespace-nowrap"
              >
                Log in
              </button>
              <button
                onClick={openAuthModal}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-black bg-white hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Sign up for free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Rename Modal */}
      {renameOpen && activeConversation && !isTemporaryChat && (
        <RenameModal
          currentTitle={activeConversation.title}
          onSave={handleRenameSave}
          onClose={() => setRenameOpen(false)}
        />
      )}

      {/* Close user menu on outside click */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </>
  )
}

