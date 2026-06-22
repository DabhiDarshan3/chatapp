<!-- resources/views/chat/index.blade.php -->
@extends('layouts.chat')

@section('title', isset($conversation) ? $conversation->title : 'New Chat')

@section('content')

    {{-- ─────────────────────────────────────────────────────────────── --}}
    {{-- ROOT CONTAINER                                                  --}}
    {{-- ─────────────────────────────────────────────────────────────── --}}
    <div class="flex h-screen overflow-hidden" id="app">

        {{-- ══════════════════════════════════════════════════════════════ --}}
        {{--  SIDEBAR                                                        --}}
        {{-- ══════════════════════════════════════════════════════════════ --}}
        <aside id="sidebar"
               class="relative flex flex-col w-72 min-w-72 bg-gray-900 border-r border-gray-800 z-40">

            {{-- ── Top: Logo + New Chat ─────────────────────────────── --}}
            <div class="flex items-center gap-3 p-4 border-b border-gray-800">
                {{-- Logo --}}
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <span class="font-bold text-lg grad-text">AI Chat</span>

                {{-- Collapse sidebar --}}
                <button id="sidebarToggleBtn"
                        onclick="toggleSidebar()"
                        class="ml-auto p-1.5 rounded-lg text-gray-500 hover:text-white
                       hover:bg-gray-800 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
                    </svg>
                </button>
            </div>

            {{-- ── New Chat Button ──────────────────────────────────── --}}
            <div class="p-3">
                <button onclick="newChat()"
                        class="w-full flex items-center justify-center gap-2 py-2.5 px-4
                       bg-gradient-to-r from-indigo-600 to-purple-600
                       hover:from-indigo-500 hover:to-purple-500
                       text-white font-semibold rounded-xl
                       transition-all duration-200 shadow-lg hover:shadow-indigo-500/30
                       hover:-translate-y-0.5 active:translate-y-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                              d="M12 4v16m8-8H4"/>
                    </svg>
                    New Chat
                </button>
            </div>

            {{-- ── Model Selector ───────────────────────────────────── --}}
            <div class="px-3 pb-3">
                <label class="text-[10px] font-semibold text-gray-500 uppercase tracking-widest
                      mb-1.5 block px-1">
                    Model
                </label>
                <div class="relative">
                    <select id="modelSelect"
                            class="w-full appearance-none bg-gray-800 border border-gray-700
                           text-gray-300 text-sm rounded-xl px-3 py-2.5 pr-8
                           focus:outline-none focus:border-indigo-500 focus:ring-1
                           focus:ring-indigo-500 transition-colors cursor-pointer">
                        @foreach($models as $providerId => $providerData)
                            <optgroup label="{{ $providerData['icon'] }} {{ $providerData['label'] }}">
                                @foreach($providerData['models'] as $modelId => $modelData)
                                    <option value="{{ $providerId }}:{{ $modelId }}"
                                        @selected(
                                            isset($conversation)
                                                ? ($conversation->provider === $providerId && $conversation->model === $modelId)
                                                : ($providerId === ($defaultProvider ?? 'openai') && $modelId === ($defaultModel ?? 'gpt-4o'))
                                        )>
                                        {{ $modelData['label'] }}
                                        @if($modelData['badge']) — {{ $modelData['badge'] }} @endif
                                    </option>
                                @endforeach
                            </optgroup>
                        @endforeach
                    </select>
                    <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M19 9l-7 7-7-7"/>
                    </svg>
                </div>
            </div>

            {{-- ── Conversations List ───────────────────────────────── --}}
            <div class="flex-1 overflow-y-auto px-2 pb-2">
                <p class="text-[10px] font-semibold text-gray-500 uppercase tracking-widest
                  px-2 py-2 mb-0.5">
                    Recent
                </p>

                <div id="convList">
                    @forelse($conversations as $conv)
                        @include('chat.partials.conv-item', ['conv' => $conv])
                    @empty
                        <div id="noConvMsg"
                             class="text-center py-10 text-gray-600">
                            <svg class="w-10 h-10 mx-auto mb-2 opacity-40"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                      d="M8 12h.01M12 12h.01M16 12h.01
                                 M21 12c0 4.418-4.03 8-9 8
                                 a9.863 9.863 0 01-4.255-.949
                                 L3 20l1.395-3.72
                                 C3.512 15.042 3 13.574 3 12
                                 c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                            </svg>
                            <p class="text-sm">No conversations yet</p>
                        </div>
                    @endforelse
                </div>
            </div>

            {{-- ── Sidebar Footer ───────────────────────────────────── --}}
            <div class="p-3 border-t border-gray-800">
                <div class="flex items-center gap-3 px-2 py-1.5">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center font-bold text-sm flex-shrink-0">
                        A
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-300 truncate">AI Assistant</p>
                        <p class="text-xs text-gray-600">Laravel AI SDK</p>
                    </div>
                    <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online"></span>
                </div>
            </div>
        </aside>

        {{-- ══════════════════════════════════════════════════════════════ --}}
        {{--  MAIN AREA                                                      --}}
        {{-- ══════════════════════════════════════════════════════════════ --}}
        <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

            {{-- ── Top Bar ──────────────────────────────────────────── --}}
            <header class="flex items-center gap-3 px-5 py-3.5
                   border-b border-gray-800 bg-gray-900 flex-shrink-0">

                {{-- Show sidebar button (when collapsed) --}}
                <button id="showSidebarBtn"
                        onclick="toggleSidebar()"
                        class="hidden p-1.5 rounded-lg text-gray-500 hover:text-white
                       hover:bg-gray-800 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                </button>

                {{-- Title (editable) --}}
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 group w-fit max-w-full">
                        <h1 id="chatTitle"
                            class="text-sm font-semibold text-gray-200 truncate max-w-xs">
                            {{ isset($conversation) ? $conversation->title : 'New Chat' }}
                        </h1>
                        @isset($conversation)
                            <button onclick="startRename()"
                                    class="opacity-0 group-hover:opacity-100 p-0.5 rounded
                               text-gray-600 hover:text-gray-400 transition-all">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                          d="M15.232 5.232l3.536 3.536
                                 m-2.036-5.036a2.5 2.5 0 113.536 3.536
                                 L6.5 21.036H3v-3.572L16.732 3.732z"/>
                                </svg>
                            </button>
                        @endisset
                    </div>
                    <p id="chatSubtitle" class="text-xs text-gray-600">
                        @isset($conversation)
                            {{ $conversation->provider_label }} · {{ $conversation->model_label }}
                        @else
                            Start a new conversation
                        @endisset
                    </p>
                </div>

                {{-- Actions --}}
                <div class="flex items-center gap-1.5">
                    @isset($conversation)
                        {{-- Clear chat --}}
                        <button onclick="clearChat({{ $conversation->id }})"
                                title="Clear chat"
                                class="p-2 rounded-lg text-gray-500 hover:text-white
                           hover:bg-gray-800 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21
                             H7.862a2 2 0 01-1.995-1.858L5 7
                             m5 4v6m4-6v6m1-10V4
                             a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    @endisset

                    {{-- Status dot --}}
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        bg-emerald-900/30 border border-emerald-800/50">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span class="text-xs text-emerald-400 font-medium">Online</span>
                    </div>
                </div>
            </header>

            {{-- ── Messages ─────────────────────────────────────────── --}}
            <div id="messagesWrap"
                 class="flex-1 overflow-y-auto scroll-smooth">

                {{-- Welcome screen --}}
                <div id="welcomeScreen"
                     class="{{ (isset($messages) && $messages->isNotEmpty()) ? 'hidden' : '' }}
                    flex flex-col items-center justify-center h-full px-4 py-12">
                    @include('chat.partials.welcome')
                </div>

                {{-- Message list --}}
                <div id="msgList"
                     class="{{ (isset($messages) && $messages->isNotEmpty()) ? '' : 'hidden' }}
                    max-w-3xl mx-auto w-full px-4 py-6 space-y-2">
                    @isset($messages)
                        @foreach($messages as $msg)
                            @include('chat.partials.message', ['message' => $msg])
                        @endforeach
                    @endisset
                </div>
            </div>

            {{-- ── Input Area ───────────────────────────────────────── --}}
            <div class="flex-shrink-0 bg-gray-900 border-t border-gray-800 px-4 py-4">
                <div class="max-w-3xl mx-auto">

                    {{-- Typing Indicator --}}
                    <div id="typingBar"
                         class="hidden items-center gap-3 mb-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                            flex items-center justify-center flex-shrink-0 shadow-lg
                            shadow-indigo-500/30">
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
                            </svg>
                        </div>
                        <div class="bg-gray-800 border border-gray-700 rounded-2xl
                            rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-indigo-400 dot-1"></span>
                            <span class="w-2 h-2 rounded-full bg-indigo-400 dot-2"></span>
                            <span class="w-2 h-2 rounded-full bg-indigo-400 dot-3"></span>
                            <span class="text-xs text-gray-500 ml-2">AI is thinking…</span>
                        </div>
                    </div>

                    {{-- Input Row --}}
                    <div class="flex items-end gap-3">

                        {{-- Textarea wrapper --}}
                        <div class="flex-1 relative bg-gray-800 border border-gray-700
                            rounded-2xl focus-within:border-indigo-500
                            focus-within:ring-1 focus-within:ring-indigo-500
                            transition-all duration-200">

                    <textarea
                        id="msgInput"
                        rows="1"
                        placeholder="Message AI… (Enter to send, Shift+Enter for new line)"
                        class="w-full bg-transparent text-gray-100 placeholder-gray-600
                               text-sm px-4 py-3.5 pr-16 resize-none outline-none
                               leading-relaxed"
                    ></textarea>

                            {{-- Char counter (inside textarea) --}}
                            <span id="charCount"
                                  class="absolute right-4 bottom-3 text-xs text-gray-600
                                 select-none pointer-events-none">
                        0
                    </span>
                        </div>

                        {{-- Send Button --}}
                        <button id="sendBtn"
                                onclick="sendMessage()"
                                disabled
                                class="w-12 h-12 flex-shrink-0 flex items-center justify-center
                               rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600
                               hover:from-indigo-500 hover:to-purple-500
                               disabled:from-gray-700 disabled:to-gray-700
                               disabled:cursor-not-allowed
                               text-white shadow-lg hover:shadow-indigo-500/30
                               transition-all duration-200 hover:-translate-y-0.5
                               active:translate-y-0 disabled:shadow-none
                               disabled:hover:translate-y-0">
                            {{-- Send icon --}}
                            <svg id="sendIcon" class="w-5 h-5"
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                            {{-- Loading icon --}}
                            <svg id="loadIcon"
                                 class="w-5 h-5 hidden animate-spin"
                                 fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10"
                                        stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                        </button>
                    </div>

                    {{-- Footer Note --}}
                    <p class="text-center text-xs text-gray-700 mt-2.5 select-none">
                        AI may make mistakes — always verify important information.
                    </p>
                </div>
            </div>
        </main>
    </div>

    {{-- ── Rename Modal ─────────────────────────────────────────────── --}}
    <div id="renameModal"
         class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50
            flex items-center justify-center p-4">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 class="text-base font-semibold text-white mb-4">Rename Chat</h3>
            <input id="renameInput"
                   type="text"
                   maxlength="100"
                   class="rename-input w-full bg-gray-800 border border-gray-700 text-gray-200
                      text-sm rounded-xl px-4 py-3 mb-4 transition-colors"
                   placeholder="Enter new title…">
            <div class="flex gap-3 justify-end">
                <button onclick="closeRename()"
                        class="px-4 py-2 text-sm text-gray-400 hover:text-white
                           hover:bg-gray-800 rounded-xl transition-colors">
                    Cancel
                </button>
                <button onclick="confirmRename()"
                        class="px-5 py-2 text-sm font-semibold text-white
                           bg-indigo-600 hover:bg-indigo-500 rounded-xl
                           transition-colors">
                    Save
                </button>
            </div>
        </div>
    </div>

    {{-- ── Toast Container ──────────────────────────────────────────── --}}
    <div id="toastContainer"
         class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
    </div>

@endsection

@push('scripts')
    <script>
        // Pass server data to JS
        window.CHAT = {
            conversationId : {{ isset($conversation) ? $conversation->id : 'null' }},
            csrfToken      : '{{ csrf_token() }}',
        };
    </script>
@endpush
