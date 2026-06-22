import ChatInput from './ChatInput'
import { useChatContext } from '../../context/ChatContext'

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void
  onSend: (text: string) => void
  disabled?: boolean
}

const suggestions = [
  { icon: '🖼️', title: 'Create an image' },
  { icon: '📝', title: 'Write or edit' },
  { icon: '🔍', title: 'Look something up' },
]

export default function WelcomeScreen({ onSuggestion, onSend, disabled }: WelcomeScreenProps) {
  const { isTemporaryChat } = useChatContext()

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-4">
      <h2 className={`text-[28px] font-semibold text-[#ececf1] ${isTemporaryChat ? 'mb-2' : 'mb-6'}`}>
        {isTemporaryChat ? 'Temporary Chat' : 'What are you working on?'}
      </h2>
      
      {isTemporaryChat && (
        <p className="text-gray-400 text-sm mb-6 text-center">
          This chat won't appear in your chat history, and won't be used to train our models.
        </p>
      )}

      <div className="w-full max-w-3xl mb-4">
        <ChatInput onSend={onSend} disabled={disabled} />
      </div>

      {/* Suggestion Cards */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.title)}
            className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-[#2f2f2f]
                       border border-gray-600/50 rounded-full cursor-pointer transition-colors"
          >
            <span className="text-sm leading-none opacity-80">{s.icon}</span>
            <p className="text-[13px] font-medium text-gray-300">
              {s.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
