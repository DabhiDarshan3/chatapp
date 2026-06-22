import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, disabled, onSend])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
  }, [])

  const hasText = text.trim().length > 0

  return (
    <div className="flex-shrink-0 bg-transparent px-4 pb-4 w-full">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-[#2f2f2f] rounded-[26px] flex items-end pr-2 pb-1.5 pt-1.5 pl-3">

          <button className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0 mb-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything"
            className="w-full bg-transparent text-[#ececf1] placeholder-gray-400
                       text-[15px] px-3 py-2.5 resize-none outline-none leading-relaxed max-h-[200px]"
          />

          <div className="flex items-center gap-1 mb-1 mr-1">
            {!hasText && !disabled && (
              <button className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!hasText && !disabled}
              className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors
                ${(hasText || disabled)
                  ? 'bg-white text-black hover:bg-gray-200 cursor-pointer'
                  : 'bg-[#676767] text-gray-300 cursor-not-allowed'}`}
            >
              {disabled ? (
                // Stop generating icon (black square)
                <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              ) : hasText ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {/* Waveform icon simulation */}
                  <rect x="5" y="9" width="2" height="6" rx="1" fill="currentColor" />
                  <rect x="9" y="6" width="2" height="12" rx="1" fill="currentColor" />
                  <rect x="13" y="4" width="2" height="16" rx="1" fill="currentColor" />
                  <rect x="17" y="8" width="2" height="8" rx="1" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-gray-500 mt-2 select-none">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
