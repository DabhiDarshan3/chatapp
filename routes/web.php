<?php
// routes/web.php
//
// Sirf SPA (React) ko serve karta hai.
// Sab API/data routes -> routes/api.php mein hain.

use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

// Root redirect
Route::get('/', fn() => redirect('/app'));

// ─── React SPA Catch-All ───────────────────────────────────────
// Sab frontend routes React Router handle karta hai
Route::get('/{any?}', [ChatController::class, 'spa'])
    ->where('any', '^(?!api|up).*$')
    ->name('spa');
