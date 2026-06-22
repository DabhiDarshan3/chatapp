export default function TypingIndicator() {
  return (
    <div className="flex gap-3 w-full mb-6 items-center">
      <div className="w-8 h-8 rounded-full border-4 border-white flex items-center justify-center flex-shrink-0 animate-pulse">
        {/* The center can be dark to make it look like a thick white ring */}
      </div>
      <div className="flex items-center gap-1.5 opacity-60">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
      </div>
    </div>
  )
}
