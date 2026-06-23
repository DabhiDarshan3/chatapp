import { useChatContext } from '../../context/ChatContext'
import { useAuth } from '../../context/AuthContext'
import ConversationList from '../sidebar/ConversationList'
import type { Conversation } from '../../types'
import { useState } from 'react'
import SearchModal from '../ui/SearchModal'
import UsersPanel from '../ui/UsersPanel'
import { getAvatarColor, getAvatarInitial } from '../../utils/avatarColor'
import { requestPermission } from '../../hooks/useNotifications'

export default function Sidebar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isUsersPanelOpen, setIsUsersPanelOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    handleDeleteConversation,
    sidebarOpen,
    toggleSidebar,
  } = useChatContext()

  const { user, openAuthModal, logout } = useAuth()

  const handleNewChat = () => {
    setActiveConversation(null)
  }

  const handleSelect = (conv: Conversation) => {
    setActiveConversation(conv)
  }

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`sidebar-panel fixed md:relative flex flex-col w-[260px] min-w-[260px] bg-[#171717] z-50 md:z-40 h-full top-0 left-0
                    ${sidebarOpen ? '' : 'collapsed'}`}
      >
        {/* Top Section */}
      <div className="flex items-center justify-between px-3 pt-3.5 pb-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#202123] transition-colors"
          title="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button
          onClick={handleNewChat}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-[#202123] transition-colors"
          title="New chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      <div className="px-3 pb-2 mt-1">
        {/* New Chat button — always visible */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg bg-[#202123] text-white transition-colors"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[13px] font-medium">New chat</span>
        </button>

        {/* Extra menu items — only for logged-in users */}
        {user && (
          <div className="flex flex-col gap-0.5 mt-4">
            {[
              { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', text: 'Search chats', action: () => { setIsSearchOpen(true); if (window.innerWidth < 768) toggleSidebar(); } },
              { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', text: 'Library' },
              { icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', text: 'Projects' },
              { icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', text: 'Apps' },
              { icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z', text: 'More', action: () => setIsMoreOpen(!isMoreOpen) },
            ].map((item, idx) => (
              <div key={idx} className="w-full">
                <button onClick={item.action} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#202123] text-gray-300 hover:text-white transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-[13px] font-medium">{item.text}</span>
                </button>
                {item.text === 'More' && isMoreOpen && (
                  <div className="pl-6 pr-2 mt-0.5 flex flex-col gap-0.5">
                    <button
                      onClick={() => { 
                        setIsUsersPanelOpen(true); 
                        if (window.innerWidth < 768) toggleSidebar(); 
                        requestPermission().catch(() => {});
                      }}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#202123] text-gray-300 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[13px] font-medium">Chat</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conversations List — only for logged-in users */}
      {user ? (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2 mt-2">
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id ?? null}
            onSelect={handleSelect}
            onDelete={handleDeleteConversation}
          />
        </div>
      ) : (
        /* Guest: show login prompt where conversation list would be */
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-4">
          <div className="text-center">
            <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
              Log in to save your chats and access them from any device.
            </p>
            <button
              onClick={openAuthModal}
              className="w-full px-4 py-2.5 rounded-xl text-[13px] font-semibold text-black bg-white hover:bg-gray-100 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={openAuthModal}
              className="w-full mt-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-transparent border border-white/20 hover:bg-white/5 transition-colors"
            >
              Sign up for free
            </button>
          </div>
        </div>
      )}

      {/* Sidebar Footer — only for logged-in users */}
      {user && (
        <div className="p-3 relative">
          {/* User menu popup — opens upward */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
              <div className="absolute bottom-full left-3 right-3 mb-2 z-50 rounded-xl bg-[#2f2f2f] border border-white/10 shadow-2xl overflow-hidden"
                style={{ animation: 'fadeSlideUp 0.15s ease-out' }}
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); logout() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer row — clickable */}
          <button
            onClick={() => setIsUserMenuOpen(v => !v)}
            className={`w-full flex items-center justify-between px-2 py-2 rounded-md transition-colors group ${
              isUserMenuOpen ? 'bg-[#2a2a2a]' : 'hover:bg-[#202123]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                style={{ backgroundColor: getAvatarColor(user.name).bg, color: getAvatarColor(user.name).text }}
              >
                {getAvatarInitial(user.name)}
              </div>
              <div className="flex flex-col min-w-0 text-left">
                <p className="text-[13px] font-medium text-gray-200 truncate leading-tight">{user.name}</p>
                <p className="text-[11px] text-gray-400 leading-tight">Free</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="text-[11px] font-medium text-white px-2 py-1 rounded-full bg-[#343541] group-hover:bg-[#40414f] transition-colors border border-gray-600/50">
                Upgrade
              </div>
              <svg
                className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
        </div>
      )}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <UsersPanel isOpen={isUsersPanelOpen} onClose={() => setIsUsersPanelOpen(false)} />
    </aside>
    </>
  )
}


