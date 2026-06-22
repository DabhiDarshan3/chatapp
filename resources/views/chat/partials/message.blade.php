<!-- resources/views/chat/partials/message.blade.php -->

@if($message->role === 'user')
    {{-- ── USER MESSAGE ──────────────────────────────────────── --}}
    <div class="flex justify-end gap-3 msg-anim" data-role="user">
        <div class="group max-w-[78%]">
            {{-- Bubble --}}
            <div class="bg-gradient-to-br from-indigo-600 to-purple-600
                    text-white px-5 py-3.5 rounded-2xl rounded-tr-sm
                    shadow-lg shadow-indigo-900/30">
                <p class="text-sm leading-relaxed whitespace-pre-wrap break-words">{{ $message->content }}</p>
            </div>
            {{-- Meta row --}}
            <div class="flex items-center justify-end gap-2 mt-1
                    opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-xs text-gray-600">{{ $message->formatted_time }}</span>
                <button onclick="copyText(this, {{ json_encode($message->content) }})"
                        class="text-gray-600 hover:text-gray-400 transition-colors p-0.5
                           flex items-center gap-1 text-xs">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8
                             a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8
                             a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy
                </button>
            </div>
        </div>
        {{-- Avatar --}}
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">
            U
        </div>
    </div>

@elseif($message->role === 'assistant')
    {{-- ── ASSISTANT MESSAGE ─────────────────────────────────── --}}
    <div class="flex gap-3 msg-anim" data-role="assistant">
        {{-- Avatar --}}
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                flex items-center justify-center flex-shrink-0 mt-1
                shadow-md shadow-indigo-900/40">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
        </div>
        <div class="group flex-1 min-w-0 max-w-[85%]">
            {{-- Bubble --}}
            <div class="bg-gray-800 border border-gray-700/60 px-5 py-4
                    rounded-2xl rounded-tl-sm shadow-md">
                <div class="md text-gray-200 text-sm leading-relaxed break-words">
                    {!! \Illuminate\Support\Str::of($message->content)->markdown([
                        'html_input'         => 'strip',
                        'allow_unsafe_links' => false,
                    ]) !!}
                </div>
            </div>
            {{-- Meta row --}}
            <div class="flex items-center gap-3 mt-1
                    opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-xs text-gray-600">{{ $message->formatted_time }}</span>
                <button onclick="copyText(this, {{ json_encode($message->content) }})"
                        class="text-gray-600 hover:text-gray-400 transition-colors
                           flex items-center gap-1 text-xs p-0.5">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8
                             a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8
                             a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy response
                </button>
                <button onclick="regenerate()"
                        class="text-gray-600 hover:text-gray-400 transition-colors
                           flex items-center gap-1 text-xs p-0.5">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9
                             m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2
                             m15.357 2H15"/>
                    </svg>
                    Regenerate
                </button>
            </div>
        </div>
    </div>
@endif
