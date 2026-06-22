<!-- resources/views/chat/partials/conv-item.blade.php -->
<div class="conv-item group relative rounded-xl mb-0.5 cursor-pointer
            hover:bg-gray-800/60 transition-colors
            {{ isset($conversation) && $conversation->id === $conv->id ? 'active' : '' }}"
     data-id="{{ $conv->id }}">
    <a href="{{ route('chat.show', $conv) }}"
       class="flex items-center gap-3 px-3 py-2.5">
        {{-- Icon --}}
        <div class="w-8 h-8 rounded-lg bg-gray-700/60 flex items-center
                    justify-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M8 12h.01M12 12h.01M16 12h.01
                         M21 12c0 4.418-4.03 8-9 8
                         a9.863 9.863 0 01-4.255-.949
                         L3 20l1.395-3.72
                         C3.512 15.042 3 13.574 3 12
                         c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
        </div>
        {{-- Text --}}
        <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-gray-300 truncate
                      group-hover:text-white transition-colors conv-title">
                {{ $conv->title }}
            </p>
            <p class="text-[10px] text-gray-600 mt-0.5">
                {{ $conv->updated_at->diffForHumans() }}
            </p>
        </div>
    </a>

    {{-- Action Buttons (hover) --}}
    <div class="absolute right-2 top-1/2 -translate-y-1/2
                opacity-0 group-hover:opacity-100 transition-opacity
                flex items-center gap-0.5">
        {{-- Delete --}}
        <button onclick="deleteConv({{ $conv->id }}, event)"
                title="Delete"
                class="p-1.5 rounded-lg text-gray-600 hover:text-red-400
                       hover:bg-gray-700 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21
                         H7.862a2 2 0 01-1.995-1.858L5 7
                         m5 4v6m4-6v6
                         m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        </button>
    </div>
</div>
