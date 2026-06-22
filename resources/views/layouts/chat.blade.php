<!-- resources/views/layouts/chat.blade.php -->
<!DOCTYPE html>
<html lang="en" class="h-full dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'AI Chat') — {{ config('app.name') }}</title>

    {{-- ✅ Vite CSS (Tailwind via @tailwindcss/vite plugin) --}}
    @vite(['resources/css/app.css'])

    {{-- Highlight.js for code syntax --}}
    <link rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
</head>
<body class="h-full bg-gray-950 text-gray-100 overflow-hidden">

@yield('content')

{{-- ✅ Load CDN libs first --}}
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>

{{-- ✅ Load chat.js via Vite AFTER CDN libs --}}
@vite(['resources/js/chat.js'])

{{-- ✅ window.CHAT config injected AFTER chat.js --}}
@stack('scripts')

</body>
</html>
