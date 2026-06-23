import { useState, useCallback } from 'react'
import type { Message } from '../../types'
import MarkdownRenderer from '../ui/MarkdownRenderer'

interface MessageBubbleProps {
  message: Message
  onRegenerate?: () => void
}

export default function MessageBubble({ message, onRegenerate }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  if (message.role === 'user') {
    return (
      <div className="flex justify-end gap-3 mb-6 w-full group">
        <div className="max-w-[70%]">
          <div className="bg-[#2f2f2f] text-[#ececf1] px-5 py-3 rounded-3xl">
            {message.attachments?.map((att, idx) => {
              if (att.type === 'image_url' && att.image_url?.url) {
                return (
                  <img 
                    key={idx} 
                    src={att.image_url.url} 
                    alt="Attachment" 
                    className="max-w-full rounded-lg mb-2 max-h-64 object-contain"
                  />
                )
              }
              return null
            })}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex flex-col gap-2 w-full mb-6 group">
      <div className="text-[#ececf1] text-[15px] leading-relaxed md w-full">
        <MarkdownRenderer content={message.content} />
      </div>
      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="Read Aloud">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
        <button onClick={handleCopy} className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="Copy">
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <button className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="Good response">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514" />
          </svg>
        </button>
        <button className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="Bad response">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.514" />
          </svg>
        </button>
        {onRegenerate && (
          <button onClick={onRegenerate} className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="Regenerate">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        <button className="text-gray-400 hover:text-gray-200 transition-colors p-1.5 rounded-md hover:bg-[#2f2f2f]" title="More actions">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}
