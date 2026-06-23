<?php

namespace App\Http\Controllers;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class DirectMessageController extends Controller
{
    /**
     * GET /api/dm/{userId}
     * Fetch all messages between the authenticated user and the given user.
     */
    public function index(Request $request, int $userId): JsonResponse
    {
        $me = Auth::id();

        // Mark messages from the other user as read
        DirectMessage::where('sender_id', $userId)
            ->where('receiver_id', $me)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = DirectMessage::where(function ($q) use ($me, $userId) {
                $q->where('sender_id', $me)->where('receiver_id', $userId);
            })
            ->orWhere(function ($q) use ($me, $userId) {
                $q->where('sender_id', $userId)->where('receiver_id', $me);
            })
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'body'       => $m->body,
                'sender_id'  => $m->sender_id,
                'is_mine'    => $m->sender_id === $me,
                'is_ai'      => (bool) $m->is_ai,
                'attachments'=> $m->attachments,
                'read_at'    => $m->read_at ? $m->read_at->format('Y-m-d H:i:s') : null,
                'created_at' => $m->created_at->format('H:i'),
                'date'       => $m->created_at->diffForHumans(),
            ]);

        return response()->json(['messages' => $messages]);
    }

    /**
     * POST /api/dm/{userId}
     * Send a message to the given user.
     */
    public function store(Request $request, int $userId): JsonResponse
    {
        $data = $request->validate([
            'body'        => 'nullable|string|max:5000',
            'attachments' => 'nullable|array',
        ]);

        if (empty($data['body']) && empty($data['attachments'])) {
            return response()->json(['error' => 'Message or attachment required'], 422);
        }

        $me = Auth::user();
        $receiver = User::findOrFail($userId);

        $msg = DirectMessage::create([
            'sender_id'   => $me->id,
            'receiver_id' => $receiver->id,
            'body'        => $data['body'] ?? '',
            'attachments' => $data['attachments'] ?? null,
        ]);

        return response()->json([
            'id'         => $msg->id,
            'body'       => $msg->body,
            'sender_id'  => $msg->sender_id,
            'is_mine'    => true,
            'is_ai'      => false,
            'attachments'=> $msg->attachments,
            'read_at'    => null,
            'created_at' => $msg->created_at->format('H:i'),
            'date'       => $msg->created_at->diffForHumans(),
        ], 201);
    }

    /**
     * POST /api/dm/{userId}/gpt
     * @gpt mention detect hone par AI response generate karo aur store karo.
     * AI ka response dono participants ko dikhega (sender_id = receiver_id trick se).
     */
    public function gptReply(Request $request, int $userId): JsonResponse
    {
        $data = $request->validate([
            'prompt'  => 'required|string|max:5000',
            'history' => 'nullable|array',
        ]);

        $me       = Auth::user();
        $receiver = User::findOrFail($userId);

        $rawHistory = collect($data['history'] ?? [])
            ->takeRight(10)
            ->map(fn($m) => [
                'role' => $m['is_mine'] ? 'user' : 'model',
                'text' => $m['body'],
            ])
            ->values()
            ->toArray();

        // Gemini strict alternating roles: Combine consecutive identical roles
        $mergedHistory = [];
        foreach ($rawHistory as $msg) {
            $lastIndex = count($mergedHistory) - 1;
            if ($lastIndex >= 0 && $mergedHistory[$lastIndex]['role'] === $msg['role']) {
                $mergedHistory[$lastIndex]['parts'][0]['text'] .= "\n\n" . $msg['text'];
            } else {
                $mergedHistory[] = [
                    'role'  => $msg['role'],
                    'parts' => [['text' => $msg['text']]],
                ];
            }
        }

        // Remove @gpt from prompt for AI
        $cleanPrompt = trim(preg_replace('/@gpt\b/i', '', $data['prompt']));
        if (empty($cleanPrompt)) {
            $cleanPrompt = 'Hello';
        }

        $lastIndex = count($mergedHistory) - 1;
        if ($lastIndex >= 0 && $mergedHistory[$lastIndex]['role'] === 'user') {
            $mergedHistory[$lastIndex]['parts'][0]['text'] .= "\n\n" . $cleanPrompt;
            $contents = $mergedHistory;
        } else {
            $contents = array_merge($mergedHistory, [
                ['role' => 'user', 'parts' => [['text' => $cleanPrompt]]]
            ]);
        }

        // Call Gemini (reuse config from ai.php)
        $aiConfig   = config('ai');
        $apiKey     = $aiConfig['providers']['gemini']['api_key'] ?? env('GEMINI_API_KEY');
        $model      = 'gemini-2.0-flash';
        $endpoint   = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

        $payload = [
            'contents' => $contents,
            'generationConfig' => ['maxOutputTokens' => 1024],
        ];

        try {
            $response = Http::timeout(30)->post($endpoint, $payload);
            if ($response->failed()) {
                \Log::error('Gemini API Error: ' . $response->body());
                $aiText = 'Sorry, AI is unavailable right now. (API Error)';
            } else {
                $aiText = $response->json('candidates.0.content.parts.0.text') ?? 'Sorry, I could not generate a response.';
            }
        } catch (\Throwable $e) {
            \Log::error('Gemini API Exception: ' . $e->getMessage());
            $aiText = 'AI connection failed.';
        }

        // Store AI response — visible to both users:
        // sender_id = receiver's id, receiver_id = sender's id, is_ai = true
        // This way both sides see it when they poll GET /api/dm/{userId}
        DirectMessage::create([
            'sender_id'   => $receiver->id,
            'receiver_id' => $me->id,
            'body'        => $aiText,
            'is_ai'       => true,
        ]);
        // Mirror for the other side
        DirectMessage::create([
            'sender_id'   => $me->id,
            'receiver_id' => $receiver->id,
            'body'        => $aiText,
            'is_ai'       => true,
        ]);

        return response()->json(['body' => $aiText]);
    }

    /**
     * GET /api/dm/unread
     * Return all unread messages sent TO the current user, grouped by sender.
     */
    public function unread(Request $request): JsonResponse
    {
        $me = Auth::id();

        $messages = DirectMessage::with('sender:id,name,email')
            ->where('receiver_id', $me)
            ->whereNull('read_at')
            ->where('is_ai', false) // AI responses generate notification nahi karte
            ->orderBy('created_at')
            ->get()
            ->map(fn($m) => [
                'id'           => $m->id,
                'body'         => $m->body,
                'sender_id'    => $m->sender_id,
                'sender_name'  => $m->sender->name,
                'sender_email' => $m->sender->email,
                'created_at'   => $m->created_at->format('H:i'),
            ]);

        return response()->json(['messages' => $messages]);
    }
}
