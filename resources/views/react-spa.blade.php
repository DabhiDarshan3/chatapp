<!DOCTYPE html>
<html lang="en" class="h-full dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ $csrfToken }}">
    <title>AI Chat</title>
    @if($cssFile)
        <link rel="stylesheet" href="{{ asset('build-react/' . $cssFile) }}">
    @endif
</head>
<body class="h-full bg-gray-950 text-gray-100 overflow-hidden">
    <div id="root"></div>
    @if($jsFile)
        <script type="module" src="{{ asset('build-react/' . $jsFile) }}"></script>
    @endif
</body>
</html>
