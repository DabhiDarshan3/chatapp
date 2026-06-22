<?php
// app/Services/ChatService.php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Str;
use Laravel\Ai\Ai;
use Laravel\Ai\Messages\UserMessage;
use Laravel\Ai\Messages\AssistantMessage;
use Laravel\Ai\Messages\SystemMessage;

class ChatService
{
    // ─── Available Models ───────────────────────────────────────

    public function getAvailableModels(): array
    {
        return [
            'openai' => [
                'label'  => 'OpenAI',
                'icon'   => '🟢',
                'models' => [
                    'gpt-4o'        => ['label' => 'GPT-4o',        'badge' => 'Recommended'],
                    'gpt-4o-mini'   => ['label' => 'GPT-4o Mini',   'badge' => 'Fast'],
                    'gpt-4-turbo'   => ['label' => 'GPT-4 Turbo',   'badge' => 'Powerful'],
                    'gpt-3.5-turbo' => ['label' => 'GPT-3.5 Turbo', 'badge' => 'Economy'],
                ],
            ],
            'anthropic' => [
                'label'  => 'Anthropic',
                'icon'   => '🟣',
                'models' => [
                    'claude-3-5-sonnet-20241022' => ['label' => 'Claude 3.5 Sonnet', 'badge' => 'Recommended'],
                    'claude-3-opus-20240229'     => ['label' => 'Claude 3 Opus',     'badge' => 'Powerful'],
                    'claude-3-haiku-20240307'    => ['label' => 'Claude 3 Haiku',    'badge' => 'Fast'],
                ],
            ],
            'gemini' => [
                'label'  => 'Google',
                'icon'   => '🔵',
                'models' => [
                    'gemini-flash-latest' => ['label' => 'Gemini Flash (Free)', 'badge' => 'Free / Unlimited'],
                    'gemini-3.1-flash-lite-preview' => ['label' => 'Gemini 3.1 Flash Lite', 'badge' => 'Free Preview'],
                ],
            ],
            'openrouter' => [
                'label'  => 'OpenRouter',
                'icon'   => '🟠',
                'models' => [
                    'google/gemma-4-31b-it:free'                  => ['label' => 'Gemma 4 31B',        'badge' => 'Recommended'],
                    'qwen/qwen3-next-80b-a3b-instruct:free'       => ['label' => 'Qwen 3 Next 80B',    'badge' => 'Powerful'],
                    'nvidia/nemotron-3-super-120b-a12b:free'      => ['label' => 'Nemotron 3 120B',    'badge' => 'Powerful'],
                    'google/gemma-4-26b-a4b-it:free'              => ['label' => 'Gemma 4 26B',        'badge' => 'Fast'],
                    'liquid/lfm-2.5-1.2b-instruct:free'           => ['label' => 'Liquid LFM 2.5',     'badge' => 'Fast'],
                    'nvidia/nemotron-nano-9b-v2:free'             => ['label' => 'Nemotron Nano 9B',   'badge' => 'Lightweight'],
                ],
            ],
        ];
    }

    // ─── Create Conversation ────────────────────────────────────

    public function createConversation(
        string $provider = null,
        string $model    = null
    ): Conversation {
        return Conversation::create([
            'user_id'  => auth()->id(),
            'title'    => 'New Chat',
            'provider' => $provider ?: config('ai.default', 'openai'),
            'model'    => $model    ?: config('ai.providers.' . ($provider ?: config('ai.default', 'openai')) . '.default_model', 'gpt-4o'),
        ]);
    }

    // ─── Stream Response ────────────────────────────────────────

    public function stream(Conversation $conversation, string $userMessage)
    {
        // 1. Save user message
        Message::create([
            'conversation_id' => $conversation->id,
            'role'            => 'user',
            'content'         => $userMessage,
        ]);

        // 2. Build full message history
        $history      = $this->buildHistory($conversation);
        $systemPrompt = $this->getSystemPrompt($conversation);

        // 3. Stream AI response
        return response()->stream(
            function () use ($conversation, $history, $systemPrompt) {
                $fullContent = '';

                try {
                    // ✅ CORRECT API for laravel/ai v0.8.1
                    // Step 1: Get the text provider
                    $textProvider = Ai::textProvider($conversation->provider);

                    // Step 2: Get the gateway from provider
                    $gateway = $textProvider->textGateway();

                    // Map deprecated Gemini models to their current equivalents
                    $modelName = $conversation->model;
                    if ($modelName === 'gemini-1.5-pro') {
                        $modelName = 'gemini-1.5-pro-latest';
                    } elseif ($modelName === 'gemini-1.5-flash') {
                        $modelName = 'gemini-flash-latest';
                    }
                    // Step 3: Stream text
                    $stream = $gateway->streamText(
                        invocationId : uniqid('chat_', true),
                        provider     : $textProvider,
                        model        : $modelName,
                        instructions : $systemPrompt,
                        messages     : $history,
                    );

                    // Step 4: Loop through stream chunks
                    foreach ($stream as $chunk) {
                        // TextDelta chunks carry the incremental text in ->delta
                        $text = '';
                        if ($chunk instanceof \Laravel\Ai\Streaming\Events\TextDelta) {
                            $text = $chunk->delta ?? '';
                        } elseif (isset($chunk->delta)) {
                            $text = $chunk->delta;
                        } elseif (is_string($chunk)) {
                            $text = $chunk;
                        } elseif (isset($chunk->text)) {
                            $text = $chunk->text;
                        } elseif (isset($chunk->content)) {
                            $text = $chunk->content;
                        }

                        $fullContent .= $text;

                        if ($text !== '') {
                            $this->sendSSE([
                                'type'    => 'delta',
                                'content' => $text,
                            ]);
                        }
                    }

                    // Save assistant message
                    Message::create([
                        'conversation_id' => $conversation->id,
                        'role'            => 'assistant',
                        'content'         => $fullContent,
                    ]);

                    // Auto-generate title on first exchange
                    $msgCount = $conversation->messages()->count();
                    if ($msgCount <= 2) {
                        $title = $this->generateTitle($conversation);
                        $conversation->update(['title' => $title]);
                    }

                    // Done event
                    $this->sendSSE([
                        'type'  => 'done',
                        'title' => $conversation->fresh()->title,
                        'id'    => $conversation->id,
                    ]);

                } catch (\Throwable $e) {
                    $this->sendSSE([
                        'type'    => 'error',
                        'message' => $e->getMessage(),
                    ]);
                }
            },
            200,
            [
                'Content-Type'      => 'text/event-stream',
                'Cache-Control'     => 'no-cache, no-store',
                'X-Accel-Buffering' => 'no',
                'Connection'        => 'keep-alive',
            ]
        );
    }

    // ─── Stream Temporary Response ──────────────────────────────

    public function streamTemporary(string $userMessage, array $historyData, string $provider, string $modelName)
    {
        // 1. Build history from provided array
        $history = collect($historyData)->map(function ($message) {
            return match ($message['role'] ?? 'user') {
                'user'      => new UserMessage($message['content'] ?? ''),
                'assistant' => new AssistantMessage($message['content'] ?? ''),
                default     => new UserMessage($message['content'] ?? ''),
            };
        })->toArray();

        // Append the current message
        $history[] = new UserMessage($userMessage);

        // 2. Default System Prompt
        $systemPrompt = 'You are a helpful, friendly, and highly knowledgeable AI assistant.
                Provide clear, accurate, well-structured responses.
                Use Markdown formatting (headings, lists, code blocks) when appropriate.
                Be concise yet thorough. When writing code, always specify the language.';

        // 3. Stream AI response without saving
        return response()->stream(
            function () use ($provider, $modelName, $history, $systemPrompt) {
                try {
                    $textProvider = Ai::textProvider($provider);
                    $gateway = $textProvider->textGateway();

                    if ($modelName === 'gemini-1.5-pro') {
                        $modelName = 'gemini-1.5-pro-latest';
                    } elseif ($modelName === 'gemini-1.5-flash') {
                        $modelName = 'gemini-flash-latest';
                    }

                    $stream = $gateway->streamText(
                        invocationId : uniqid('temp_', true),
                        provider     : $textProvider,
                        model        : $modelName,
                        instructions : $systemPrompt,
                        messages     : $history,
                    );

                    foreach ($stream as $chunk) {
                        $text = '';
                        if ($chunk instanceof \Laravel\Ai\Streaming\Events\TextDelta) {
                            $text = $chunk->delta ?? '';
                        } elseif (isset($chunk->delta)) {
                            $text = $chunk->delta;
                        } elseif (is_string($chunk)) {
                            $text = $chunk;
                        } elseif (isset($chunk->text)) {
                            $text = $chunk->text;
                        } elseif (isset($chunk->content)) {
                            $text = $chunk->content;
                        }

                        if ($text !== '') {
                            $this->sendSSE([
                                'type'    => 'delta',
                                'content' => $text,
                            ]);
                        }
                    }

                    $this->sendSSE([
                        'type' => 'done',
                    ]);

                } catch (\Throwable $e) {
                    $this->sendSSE([
                        'type'    => 'error',
                        'message' => $e->getMessage(),
                    ]);
                }
            },
            200,
            [
                'Content-Type'      => 'text/event-stream',
                'Cache-Control'     => 'no-cache, no-store',
                'X-Accel-Buffering' => 'no',
                'Connection'        => 'keep-alive',
            ]
        );
    }

    // ─── Build Message History ───────────────────────────────────

    private function buildHistory(Conversation $conversation): array
    {
        return $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(function ($message) {
                return match ($message->role) {
                    'user'      => new UserMessage($message->content),
                    'assistant' => new AssistantMessage($message->content),
                    default     => new UserMessage($message->content),
                };
            })
            ->toArray();
    }

    // ─── Get System Prompt ───────────────────────────────────────

    private function getSystemPrompt(Conversation $conversation): string
    {
        return $conversation->system_prompt
            ?? 'You are a helpful, friendly, and highly knowledgeable AI assistant.
                Provide clear, accurate, well-structured responses.
                Use Markdown formatting (headings, lists, code blocks) when appropriate.
                Be concise yet thorough. When writing code, always specify the language.';
    }

    // ─── Generate Title ──────────────────────────────────────────

    private function generateTitle(Conversation $conversation): string
    {
        try {
            $firstUserMsg = $conversation->messages()
                ->where('role', 'user')
                ->first();

            if (! $firstUserMsg) {
                return 'New Chat';
            }

            // ✅ Use generateText for title (non-streaming)
            $textProvider = Ai::textProvider($conversation->provider);
            $gateway      = $textProvider->textGateway();

            // Map deprecated Gemini models to their current equivalents
            $modelName = $conversation->model;
            if ($modelName === 'gemini-1.5-pro') {
                $modelName = 'gemini-1.5-pro-latest';
            } elseif ($modelName === 'gemini-1.5-flash') {
                $modelName = 'gemini-flash-latest';
            }

            $response = $gateway->generateText(
                provider     : $textProvider,
                model        : $modelName,
                instructions : 'You generate short chat titles. Return only the title, nothing else.',
                messages     : [
                    new UserMessage(
                        sprintf(
                            'Generate a short title (3-6 words, no punctuation, no quotes) for a chat that starts with: "%s". Return only the title.',
                            Str::limit($firstUserMsg->content, 200)
                        )
                    ),
                ],
            );

            return Str::limit(trim($response->text), 60);

        } catch (\Throwable $e) {
            return Str::limit(
                $conversation->messages()
                    ->where('role', 'user')
                    ->first()?->content ?? 'New Chat',
                40
            );
        }
    }

    // ─── SSE Helper ──────────────────────────────────────────────

    private function sendSSE(array $data): void
    {
        echo 'data: ' . json_encode($data) . "\n\n";
        ob_flush();
        flush();
    }
}
