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
        'meta'        => 'array',
        'attachments' => 'array',
        'content'     => \App\Casts\EncryptedFallback::class,
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
        return $this->created_at->timezone('Asia/Kolkata')->format('H:i');
    }

    public function getFormattedDateAttribute(): string
    {
        $istTime = $this->created_at->timezone('Asia/Kolkata');
        
        if ($istTime->isToday()) {
            return 'Today at ' . $istTime->format('H:i');
        }
        if ($istTime->isYesterday()) {
            return 'Yesterday at ' . $istTime->format('H:i');
        }
        return $istTime->format('M d, Y H:i');
    }
}
