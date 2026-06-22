import { useRef, useEffect } from 'react'
import type { Message } from '../../types'
import MessageBubble from './MessageBubble'
import WelcomeScreen from './WelcomeScreen'
import TypingIndicator from './TypingIndicator'
import MarkdownRenderer from '../ui/MarkdownRenderer'

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
  streamingText: string
  streamingError: string | null
  onSuggestion: (text: string) => void
  onRegenerate: () => void
  onSend: (text: string) => void
}

export default function MessageList({
  messages,
  isStreaming,
  streamingText,
  streamingError,
  onSuggestion,
  onRegenerate,
  onSend,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const showWelcome = messages.length === 0 && !isStreaming

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText, isStreaming])

  return (
    <div ref={wrapRef} className="flex-1 overflow-y-auto scroll-smooth w-full">
      {showWelcome ? (
        <div className="flex flex-col items-center justify-center h-full">
          <WelcomeScreen onSuggestion={onSuggestion} onSend={onSend} disabled={isStreaming} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRegenerate={
                idx === messages.length - 1 && msg.role === 'assistant'
                  ? onRegenerate
                  : undefined
              }
            />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingText && (
            <div className="flex flex-col gap-2 w-full mb-6 group">
              <div className="text-[#ececf1] text-[15px] leading-relaxed md w-full">
                <MarkdownRenderer content={streamingText} />
                <span className="cursor-blink inline-block w-3 h-3 rounded-full bg-white ml-1 align-middle" />
              </div>
            </div>
          )}

          {/* Streaming error */}
          {streamingError && (
            <div className="flex gap-4 w-full mb-6 group">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 max-w-full">
                <div className="bg-red-900/20 border border-red-800/30 px-5 py-4 rounded-xl text-red-200 text-[15px]">
                  {streamingError}
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingText && !streamingError && (
            <TypingIndicator />
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
