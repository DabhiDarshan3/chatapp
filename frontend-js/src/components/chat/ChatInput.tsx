import { useState, useRef, useCallback, useEffect, type KeyboardEvent, type ChangeEvent } from 'react'

interface ChatInputProps {
  onSend: (text: string, image?: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('')
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const attachMenuRef = useRef<HTMLDivElement>(null)

  // Close attach menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setAttachMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
    setAttachMenuOpen(false)
    e.target.value = '' // reset input
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    // Can send if there's text OR an image
    if ((!trimmed && !selectedImage) || disabled) return
    onSend(trimmed, selectedImage || undefined)
    setText('')
    setSelectedImage(null)
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

  const hasText = text.trim().length > 0 || selectedImage !== null

  return (
    <div className="flex-shrink-0 bg-transparent px-4 pb-4 w-full">
      <div className="max-w-3xl mx-auto">
        <div className="relative bg-[#2f2f2f] rounded-[26px] flex flex-col pr-2 pb-1.5 pt-1.5 pl-3">
          
          {/* Image Preview */}
          {selectedImage && (
            <div className="relative w-16 h-16 mb-2 mt-1 ml-1 group">
              <img src={selectedImage} alt="Attached" className="w-full h-full object-cover rounded-lg border border-white/10" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-end w-full">
            {/* Attachment Menu */}
            <div className="relative" ref={attachMenuRef}>
              <button 
                onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0 mb-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {attachMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#2f2f2f] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Add photos
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

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

          <div className="flex items-center gap-1 mb-1 mr-1 flex-shrink-0">
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
        </div>

        <p className="text-center text-[11px] text-gray-500 mt-2 select-none">
          ChatGPT can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
