import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Conversation, Message, AppConfig, ModelsData } from '../types'
import {
  fetchConfig,
  fetchConversations,
  fetchMessages,
  createConversation,
  deleteConversation,
  clearConversation,
  renameConversation,
} from '../api/client'
import { streamMessage } from '../api/stream'
import { useToast } from '../hooks/useToast'

interface ChatContextType {
  // Config
  config: AppConfig | null
  models: ModelsData
  defaultProvider: string
  defaultModel: string
  selectedProvider: string
  selectedModel: string
  setSelectedProvider: (p: string) => void
  setSelectedModel: (m: string) => void

  // Conversations
  conversations: Conversation[]
  activeConversation: Conversation | null
  setActiveConversation: (c: Conversation | null) => void
  loadConversations: () => Promise<void>
  handleCreateConversation: () => Promise<Conversation | null>
  handleDeleteConversation: (id: number) => Promise<void>
  handleClearConversation: (id: number) => Promise<void>
  handleRenameConversation: (id: number, title: string) => Promise<void>

  // Messages
  messages: Message[]
  isStreaming: boolean
  streamingText: string
  streamingError: string | null

  // Send
  sendMessage: (text: string) => Promise<void>
  regenerate: () => Promise<void>

  // Toast
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[]
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Temporary Chat
  isTemporaryChat: boolean
  toggleTemporaryChat: () => void
  temporaryMessages: Message[]
}

const ChatContext = createContext<ChatContextType | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}

export function ChatProvider({ children }: { children: ReactNode }) {
  // Config
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('gemini')
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview')

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(() => {
    const params = new URLSearchParams(window.location.search)
    const urlChatId = params.get('c')
    if (urlChatId) {
      return { id: Number(urlChatId) } as Conversation
    }
    const saved = localStorage.getItem('lastActiveChat')
    return saved ? ({ id: Number(saved) } as Conversation) : null
  })

  useEffect(() => {
    if (activeConversation) {
      localStorage.setItem('lastActiveChat', activeConversation.id.toString())
    } else {
      localStorage.removeItem('lastActiveChat')
    }
  }, [activeConversation])

  // Messages
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [streamingError, setStreamingError] = useState<string | null>(null)

  // Temporary Chat
  const [isTemporaryChat, setIsTemporaryChat] = useState(false)
  const [temporaryMessages, setTemporaryMessages] = useState<Message[]>([])

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Toast
  const { toasts, addToast } = useToast()

  // Last user message for regenerate
  const lastUserMsg = useRef('')

  // Load config on mount
  useEffect(() => {
    fetchConfig().then(cfg => {
      setConfig(cfg)
      setSelectedProvider(cfg.defaultProvider)
      setSelectedModel(cfg.defaultModel)
    }).catch(() => {
      // Fallback if API fails
    })
  }, [])

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations()
      setConversations(data)

      setActiveConversationState(prev => {
        if (prev) {
          const fullConv = data.find((c: Conversation) => c.id === prev.id)
          return fullConv || null
        }
        return prev
      })
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([])
      return
    }
    fetchMessages(activeConversation.id).then(setMessages).catch(() => { })
  }, [activeConversation])

  const setActiveConversation = useCallback((c: Conversation | null) => {
    setActiveConversationState(c)
    setStreamingText('')
    setStreamingError(null)
    setIsTemporaryChat(false) // Exit temporary mode when selecting a chat
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const toggleTemporaryChat = useCallback(() => {
    setIsTemporaryChat(prev => {
      const next = !prev;
      if (next) {
        setActiveConversationState(null); // Clear active when enabling temp
        setTemporaryMessages([]); // Clear previous temp messages on toggle
      }
      return next;
    });
  }, [])

  // Create conversation
  const handleCreateConversation = useCallback(async (): Promise<Conversation | null> => {
    try {
      const res = await createConversation(selectedProvider, selectedModel)
      const conv = res.conversation
      setConversations(prev => [conv, ...prev])
      setActiveConversationState(conv)
      return conv
    } catch (err: unknown) {
      addToast(`Failed to create conversation: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
      return null
    }
  }, [selectedProvider, selectedModel, addToast])

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: number) => {
    try {
      await deleteConversation(id)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversation?.id === id) {
        setActiveConversationState(null)
      }
      addToast('Conversation deleted', 'success')
    } catch (err: unknown) {
      addToast(`Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }, [activeConversation, addToast])

  // Clear conversation
  const handleClearConversation = useCallback(async (id: number) => {
    try {
      await clearConversation(id)
      if (activeConversation?.id === id) {
        setMessages([])
        setActiveConversationState(prev =>
          prev ? { ...prev, title: 'New Chat' } : null
        )
      }
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: 'New Chat' } : c)
      )
      addToast('Chat cleared', 'success')
    } catch (err: unknown) {
      addToast(`Clear failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }, [activeConversation, addToast])

  // Rename conversation
  const handleRenameConversation = useCallback(async (id: number, title: string) => {
    try {
      const res = await renameConversation(id, title)
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: res.title } : c)
      )
      if (activeConversation?.id === id) {
        setActiveConversationState(prev =>
          prev ? { ...prev, title: res.title } : null
        )
      }
      addToast('Renamed successfully', 'success')
    } catch (err: unknown) {
      addToast(`Rename failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    }
  }, [activeConversation, addToast])

  // Send message
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    lastUserMsg.current = text

    if (isTemporaryChat) {
      const userMsg: Message = {
        id: Date.now(),
        conversation_id: 0,
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      }
      setTemporaryMessages(prev => [...prev, userMsg])
      setStreamingText('')
      setStreamingError(null)
      setIsStreaming(true)

      let fullText = ''

      import('../api/stream').then(({ streamTemporaryMessage }) => {
        streamTemporaryMessage(text, temporaryMessages, selectedProvider, selectedModel, {
          onDelta: (delta) => {
            fullText += delta
            setStreamingText(fullText)
          },
          onDone: () => {
            const assistantMsg: Message = {
              id: Date.now() + 1,
              conversation_id: 0,
              role: 'assistant',
              content: fullText,
              created_at: new Date().toISOString(),
            }
            setTemporaryMessages(prev => [...prev, assistantMsg])
            setStreamingText('')
            setIsStreaming(false)
          },
          onError: (message) => {
            setStreamingError(message)
            setIsStreaming(false)
            addToast(`Error: ${message}`, 'error')
          },
        })
      })
      return
    }

    lastUserMsg.current = text

    // Add user message optimistically
    const userMsg: Message = {
      id: Date.now(),
      conversation_id: activeConversation?.id ?? 0,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setStreamingText('')
    setStreamingError(null)
    setIsStreaming(true)

    // Create conversation if needed
    let convId = activeConversation?.id
    if (!convId) {
      const newConv = await handleCreateConversation()
      if (!newConv) {
        setIsStreaming(false)
        return
      }
      convId = newConv.id

      // Update the optimistic message's conversation_id now that we have it
      setMessages(prev =>
        prev.map(m => m.id === userMsg.id ? { ...m, conversation_id: newConv.id } : m)
      )
    }

    if (!convId) {
      setIsStreaming(false)
      addToast('Failed to start conversation', 'error')
      return
    }

    let fullText = ''

    await streamMessage(convId, text, {
      onDelta: (delta) => {
        fullText += delta
        setStreamingText(fullText)
      },
      onDone: (title, _id) => {
        // Add assistant message
        const assistantMsg: Message = {
          id: Date.now() + 1,
          conversation_id: convId!,
          role: 'assistant',
          content: fullText,
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, assistantMsg])
        setStreamingText('')
        setIsStreaming(false)

        // Update title if auto-generated
        if (title) {
          setConversations(prev =>
            prev.map(c => c.id === convId ? { ...c, title } : c)
          )
          setActiveConversationState(prev =>
            prev && prev.id === convId ? { ...prev, title } : prev
          )
        }

        // Refresh conversations to update order
        loadConversations()
      },
      onError: (message) => {
        setStreamingError(message)
        setIsStreaming(false)
        addToast(`Error: ${message}`, 'error')
      },
    })
  }, [isStreaming, activeConversation, conversations, handleCreateConversation, addToast, loadConversations])

  // Regenerate
  const regenerate = useCallback(async () => {
    if (!lastUserMsg.current || isStreaming || !activeConversation) return

    // Remove last assistant message
    if (isTemporaryChat) {
      setTemporaryMessages(prev => {
        const idx = prev.findLastIndex(m => m.role === 'assistant')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    } else {
      setMessages(prev => {
        const idx = prev.findLastIndex(m => m.role === 'assistant')
        if (idx >= 0) return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
        return prev
      })
    }

    await sendMessage(lastUserMsg.current)
  }, [isStreaming, activeConversation, isTemporaryChat, sendMessage])

  const value: ChatContextType = {
    config,
    models: config?.models ?? {},
    defaultProvider: config?.defaultProvider ?? 'gemini',
    defaultModel: config?.defaultModel ?? 'gemini-3.1-flash-lite-preview',
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,

    conversations,
    activeConversation,
    setActiveConversation,
    loadConversations,
    handleCreateConversation,
    handleDeleteConversation,
    handleClearConversation,
    handleRenameConversation,

    messages,
    isStreaming,
    streamingText,
    streamingError,

    sendMessage,
    regenerate,

    toasts,
    addToast,

    sidebarOpen,
    toggleSidebar,

    isTemporaryChat,
    toggleTemporaryChat,
    temporaryMessages,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
