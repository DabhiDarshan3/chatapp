<?php
// app/Models/Message.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'input_tokens',
        'output_tokens',
        'meta',
        'attachments',
    ];

    protected $casts = [
        'meta' => 'array',
        'attachments' => 'array',
    ];

    // ─── Relationships ──────────────────────────────────────────

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    // ─── Helpers ────────────────────────────────────────────────

    public function isUser(): bool
    {
        return $this->role === 'user';
    }

    public function isAssistant(): bool
    {
        return $this->role === 'assistant';
    }

    public function isSystem(): bool
    {
        return $this->role === 'system';
    }

    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->format('H:i');
    }

    public function getFormattedDateAttribute(): string
    {
        if ($this->created_at->isToday()) {
            return 'Today at ' . $this->created_at->format('H:i');
        }
        if ($this->created_at->isYesterday()) {
            return 'Yesterday at ' . $this->created_at->format('H:i');
        }
        return $this->created_at->format('M d, Y H:i');
    }
}
