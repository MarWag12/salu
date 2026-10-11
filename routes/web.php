<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Client\RequestController as ClientRequests;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\Technician\JobController;
use App\Http\Middleware\EnsureRole;
use Illuminate\Support\Facades\Route;

// A administração vive no Filament, em /admin (ver app/Providers/Filament/AdminPanelProvider.php).

// ---------- Site público ----------
Route::controller(PublicController::class)->group(function () {
    Route::get('/', 'home')->name('home');
    Route::get('/servicos', 'services')->name('services');
    Route::get('/servicos/sugestoes', 'suggest')->middleware('throttle:60,1')->name('services.suggest'); // JSON (Axios)
    Route::get('/servicos/{slug}', 'service')->name('services.show');
    Route::get('/tecnicos', 'technicians')->name('technicians');
});

// ---------- Autenticação ----------
Route::middleware('guest')->controller(AuthController::class)->group(function () {
    Route::get('/entrar', 'showLogin')->name('login');
    Route::post('/entrar', 'login')->middleware('throttle:10,1');
    Route::get('/registar', 'showRegister')->name('register');
    Route::post('/registar', 'register')->middleware('throttle:10,1');
    Route::get('/recuperar-palavra-passe', 'showForgot')->name('password.request');
    Route::post('/recuperar-palavra-passe', 'sendResetLink')->middleware('throttle:5,1')->name('password.email');
    Route::get('/redefinir-palavra-passe/{token}', 'showReset')->name('password.reset');
    Route::post('/redefinir-palavra-passe', 'reset')->name('password.update');
});

Route::post('/sair', [AuthController::class, 'logout'])->middleware('auth')->name('logout');

// Documento KYC (disco privado): só o próprio técnico e administradores.
Route::get('/documentos/kyc/{technician}', [DocumentController::class, 'kyc'])->middleware('auth')->name('kyc.document');

// ---------- Área do cliente ----------
Route::middleware(['auth', EnsureRole::class.':cliente'])->prefix('cliente')->name('cliente.')->group(function () {
    Route::get('/', [ClientRequests::class, 'dashboard'])->name('dashboard');
    Route::get('/pedidos', [ClientRequests::class, 'index'])->name('pedidos.index');
    Route::get('/pedidos/novo', [ClientRequests::class, 'create'])->name('pedidos.create');
    Route::post('/pedidos', [ClientRequests::class, 'store'])->name('pedidos.store');
    Route::get('/pedidos/{order}', [ClientRequests::class, 'show'])->name('pedidos.show');
    Route::post('/pedidos/{order}/cancelar', [ClientRequests::class, 'cancel'])->name('pedidos.cancel');
    Route::post('/pedidos/{order}/pagar', [ClientRequests::class, 'pay'])->name('pedidos.pay');
    Route::post('/pedidos/{order}/avaliar', [ClientRequests::class, 'review'])->name('pedidos.review');
    Route::post('/pedidos/{order}/disputa', [ClientRequests::class, 'dispute'])->name('pedidos.dispute');
});

// ---------- Área do técnico ----------
Route::middleware(['auth', EnsureRole::class.':tecnico'])->prefix('tecnico')->name('tecnico.')->group(function () {
    Route::get('/', [JobController::class, 'dashboard'])->name('dashboard');
    Route::get('/trabalhos', [JobController::class, 'index'])->name('trabalhos.index');
    Route::get('/trabalhos/{order}', [JobController::class, 'show'])->name('trabalhos.show');
    Route::post('/trabalhos/{order}/aceitar', [JobController::class, 'accept'])->name('trabalhos.accept');
    Route::post('/trabalhos/{order}/iniciar', [JobController::class, 'start'])->name('trabalhos.start');
    Route::post('/trabalhos/{order}/concluir', [JobController::class, 'complete'])->name('trabalhos.complete');
    Route::get('/perfil', [JobController::class, 'profile'])->name('profile');
    // POST (e não PUT) porque o formulário envia um ficheiro (multipart).
    Route::post('/perfil', [JobController::class, 'updateProfile'])->name('profile.update');
});
