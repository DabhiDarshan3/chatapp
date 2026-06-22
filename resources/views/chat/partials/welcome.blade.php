<!-- resources/views/chat/partials/welcome.blade.php -->
<div class="text-center max-w-2xl w-full">

    {{-- Hero Icon --}}
    <div class="relative inline-flex mb-6">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
                    flex items-center justify-center shadow-2xl shadow-indigo-500/40">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3
                         M3 13h18M5 17H3a2 2 0 01-2-2V5
                         a2 2 0 012-2h14a2 2 0 012 2v10
                         a2 2 0 01-2 2h-2"/>
            </svg>
        </div>
        <span class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500
                     rounded-full border-2 border-gray-950 animate-pulse"></span>
    </div>

    <h2 class="text-3xl font-bold text-white mb-2">How can I help you?</h2>
    <p class="text-gray-500 text-sm mb-8">
        Powered by Laravel AI SDK · GPT-4o · Claude · Gemini
    </p>

    {{-- Suggestion Cards --}}
    <div class="grid grid-cols-2 gap-3 text-left">
        @foreach([
            ['emoji' => '💻', 'title' => 'Write Code',       'prompt' => 'Write a Laravel REST API with authentication and CRUD operations'],
            ['emoji' => '✍️', 'title' => 'Write Content',    'prompt' => 'Write a professional blog post about the future of AI in software development'],
            ['emoji' => '🧮', 'title' => 'Explain Concepts', 'prompt' => 'Explain how transformer neural networks work in simple terms'],
            ['emoji' => '🐛', 'title' => 'Debug Code',       'prompt' => 'Help me debug this error: Call to undefined method App\Models\User::roles()'],
            ['emoji' => '📊', 'title' => 'Analyze Data',     'prompt' => 'How do I analyze and visualize sales data using PHP and Chart.js?'],
            ['emoji' => '🎨', 'title' => 'UI Design',        'prompt' => 'Design a modern dashboard layout with Tailwind CSS step by step'],
        ] as $s)
            <button onclick="useSuggestion('{{ addslashes($s['prompt']) }}')"
                    class="suggestion-card text-left p-4 bg-gray-800/60 hover:bg-gray-800
                       border border-gray-700/60 hover:border-indigo-500/60
                       rounded-xl group cursor-pointer">
                <div class="flex items-start gap-3">
                    <span class="text-2xl leading-none mt-0.5">{{ $s['emoji'] }}</span>
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-gray-300
                               group-hover:text-white transition-colors">
                            {{ $s['title'] }}
                        </p>
                        <p class="text-xs text-gray-600 mt-0.5 truncate">
                            {{ $s['prompt'] }}
                        </p>
                    </div>
                </div>
            </button>
        @endforeach
    </div>
</div>
