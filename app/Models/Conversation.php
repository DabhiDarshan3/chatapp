<?php
// app/Models/Conversation.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'provider',
        'model',
        'system_prompt',
        'is_pinned',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
    ];

    // ─── Relationships ──────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    // ─── Scopes ─────────────────────────────────────────────────

    public function scopeForCurrentUser($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('user_id')
                ->orWhere('user_id', auth()->id());
        });
    }

    // ─── Helpers ────────────────────────────────────────────────

    public function getProviderLabelAttribute(): string
    {
        return match ($this->provider) {
            'openai'    => 'OpenAI',
            'anthropic' => 'Anthropic',
            'gemini'    => 'Gemini',
            default     => ucfirst($this->provider),
        };
    }

    public function getModelLabelAttribute(): string
    {
        return match ($this->model) {
            'gpt-4o'                          => 'GPT-4o',
            'gpt-4o-mini'                     => 'GPT-4o Mini',
            'gpt-4-turbo'                     => 'GPT-4 Turbo',
            'gpt-3.5-turbo'                   => 'GPT-3.5 Turbo',
            'claude-3-5-sonnet-20241022'      => 'Claude 3.5 Sonnet',
            'claude-3-opus-20240229'          => 'Claude 3 Opus',
            'claude-3-haiku-20240307'         => 'Claude 3 Haiku',
            'gemini-1.5-pro'                  => 'Gemini 1.5 Pro',
            'gemini-1.5-flash'                => 'Gemini 1.5 Flash',
            default                           => $this->model,
        };
    }

    public function getTotalMessagesAttribute(): int
    {
        return $this->messages()->count();
    }
}
