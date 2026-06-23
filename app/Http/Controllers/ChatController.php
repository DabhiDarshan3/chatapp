<?php
// app/Http/Controllers/ChatController.php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function __construct(
        private readonly ChatService $chatService
    ) {}

    // ─── React SPA ─────────────────────────────────────────────

    public function spa()
    {
        $manifestPath = public_path('build-react/.vite/manifest.json');
        $manifest     = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : null;

        $entry = $manifest['src/main.tsx'] ?? null;
        $jsFile  = $entry['file']  ?? null;
        $cssFile = $entry['css'][0] ?? null;

        return view('react-spa', [
            'jsFile'  => $jsFile,
            'cssFile' => $cssFile,
            'csrfToken' => csrf_token(),
        ]);
    }

    // ─── JSON API Endpoints ────────────────────────────────────

    public function apiModels(): JsonResponse
    {
        $defaultProvider = config('ai.default', env('AI_DEFAULT_PROVIDER', 'openai'));
        $envKey          = strtoupper($defaultProvider) . '_DEFAULT_MODEL';
        $defaultModel    = env($envKey, 'gpt-4o');

        return response()->json([
            'defaultProvider' => $defaultProvider,
            'defaultModel'    => $defaultModel,
            'models'          => $this->chatService->getAvailableModels(),
        ]);
    }

    public function apiConversations(Request $request): JsonResponse
    {
        $query = Conversation::forCurrentUser()->orderByDesc('updated_at');

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $conversations = $query->get()
            ->map(fn ($c) => array_merge($c->toArray(), [
                'provider_label' => $c->provider_label,
                'model_label'    => $c->model_label,
            ]));

        return response()->json($conversations);
    }

    public function apiMessages(Conversation $conversation): JsonResponse
    {
        $messages = $conversation->messages->map(fn ($m) => array_merge($m->toArray(), [
            'formatted_time' => $m->formatted_time,
        ]));

        return response()->json($messages);
    }

    // ─── Pages ──────────────────────────────────────────────────

    public function index()
    {
        $conversations = Conversation::forCurrentUser()
            ->orderByDesc('updated_at')
            ->get();

        $defaultProvider = config('ai.default', 'openai');
        $envKey          = strtoupper($defaultProvider) . '_DEFAULT_MODEL';
        $defaultModel    = env($envKey, 'gpt-4o');

        return view('chat.index', [
            'conversations'  => $conversations,
            'conversation'   => null,
            'messages'       => collect(),
            'models'         => $this->chatService->getAvailableModels(),
            'defaultProvider'=> $defaultProvider,
            'defaultModel'   => $defaultModel,
        ]);
    }

    public function show(Conversation $conversation)
    {
        $conversations = Conversation::forCurrentUser()
            ->orderByDesc('updated_at')
            ->get();

        return view('chat.index', [
            'conversations' => $conversations,
            'conversation'  => $conversation,
            'messages'      => $conversation->messages,
            'models'        => $this->chatService->getAvailableModels(),
        ]);
    }

    // ─── API ────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'nullable|string',
            'model'    => 'nullable|string',
        ]);

        $defaultProvider = $data['provider'] ?? config('ai.default', 'openai');
        $envKey          = strtoupper($defaultProvider) . '_DEFAULT_MODEL';
        $conversation = $this->chatService->createConversation(
            $defaultProvider,
            $data['model'] ?? env($envKey, 'gpt-4o'),
        );

        return response()->json([
            'success'      => true,
            'conversation' => $conversation,
            'url'          => route('chat.show', $conversation),
        ]);
    }

    public function sendMessage(Request $request, Conversation $conversation)
    {
        $request->validate([
            'message' => 'nullable|string|max:32000',
            'image'   => 'nullable|string',
        ]);

        $data =  $this->chatService->stream(
            $conversation,
            $request->input('message') ?? '',
            $request->input('image')
        );
        Log::info('$data');
        Log::info($data);
        return $data;
    }

    public function temporaryMessage(Request $request)
    {
        $request->validate([
            'message'  => 'nullable|string|max:32000',
            'image'    => 'nullable|string',
            'history'  => 'nullable|array',
            'provider' => 'nullable|string',
            'model'    => 'nullable|string',
        ]);

        $provider = $request->input('provider', config('ai.default', 'openai'));
        $envKey   = strtoupper($provider) . '_DEFAULT_MODEL';
        $model    = $request->input('model', env($envKey, 'gpt-4o'));

        return $this->chatService->streamTemporary(
            $request->input('message') ?? '',
            $request->input('image'),
            $request->input('history', []),
            $provider,
            $model
        );
    }

    public function destroy(Conversation $conversation): JsonResponse
    {
        $conversation->delete();

        return response()->json(['success' => true]);
    }

    public function clear(Conversation $conversation): JsonResponse
    {
        $conversation->messages()->delete();
        $conversation->update(['title' => 'New Chat']);

        return response()->json(['success' => true]);
    }

    public function rename(Request $request, Conversation $conversation): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:100',
        ]);

        $conversation->update(['title' => $data['title']]);

        return response()->json(['success' => true, 'title' => $conversation->title]);
    }

    public function updateModel(Request $request, Conversation $conversation): JsonResponse
    {
        $data = $request->validate([
            'provider' => 'required|string',
            'model'    => 'required|string',
        ]);

        $conversation->update([
            'provider' => $data['provider'],
            'model'    => $data['model'],
        ]);

        return response()->json(['success' => true]);
    }
}
