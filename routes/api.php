<?php
// routes/api.php
//
// Yahan sab JSON API endpoints hain jo React SPA use karta hai.
// Laravel automatically '/api/' prefix lagate hain in routes pe.
// Middleware: 'api' (throttle) + 'web' (session/auth) dono use ho rahe hain
// taaki session-based authentication kaam kare bina Sanctum ke.

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DirectMessageController;
use Illuminate\Support\Facades\Route;

// ─── Auth (session-based) ────────────────────────────────────────
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/check-email', [AuthController::class, 'checkEmail'])->name('check-email');
    Route::post('/register',    [AuthController::class, 'register'])->name('register');
    Route::post('/login',       [AuthController::class, 'login'])->name('login');
    Route::post('/logout',      [AuthController::class, 'logout'])->name('logout');
    Route::get('/user',         [AuthController::class, 'user'])->name('user');
});

// ─── Models ──────────────────────────────────────────────────────
Route::get('/models', [ChatController::class, 'apiModels'])->name('models');

// ─── Conversations (auth required) ───────────────────────────────
Route::get('/conversations',                              [ChatController::class, 'apiConversations'])->name('conversations');
Route::get('/conversations/{conversation}/messages',      [ChatController::class, 'apiMessages'])->name('messages');

// ─── Chat ────────────────────────────────────────────────────────
Route::post('/chat',                                     [ChatController::class, 'store'])->name('chat.store');
Route::post('/chat/temporary-message',                   [ChatController::class, 'temporaryMessage'])->name('chat.temporary');
Route::get('/chat/{conversation}',                       [ChatController::class, 'show'])->name('chat.show');
Route::post('/chat/{conversation}/message',              [ChatController::class, 'sendMessage'])->name('chat.message');
Route::delete('/chat/{conversation}',                    [ChatController::class, 'destroy'])->name('chat.destroy');
Route::post('/chat/{conversation}/clear',                [ChatController::class, 'clear'])->name('chat.clear');
Route::patch('/chat/{conversation}/rename',              [ChatController::class, 'rename'])->name('chat.rename');
Route::patch('/chat/{conversation}/model',               [ChatController::class, 'updateModel'])->name('chat.model');

// ─── Users ───────────────────────────────────────────────────────
Route::get('/users', [AuthController::class, 'allUsers'])->name('users');

// ─── Direct Messages ─────────────────────────────────────────────
Route::get('/dm/unread',           [DirectMessageController::class, 'unread'])  ->name('dm.unread');
Route::get('/dm/{userId}',         [DirectMessageController::class, 'index'])   ->name('dm.index');
Route::post('/dm/{userId}',        [DirectMessageController::class, 'store'])   ->name('dm.store');
Route::post('/dm/{userId}/gpt',    [DirectMessageController::class, 'gptReply'])->name('dm.gpt');
Route::post('/dm/{userId}/typing', [DirectMessageController::class, 'typing'])  ->name('dm.typing');
