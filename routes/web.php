<?php

use App\Http\Controllers\Client\DashboardController as ClientDashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderTaskController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Provider\DashboardController as ProviderDashboardController;
use App\Http\Controllers\Provider\EarningsController as ProviderEarningsController;
use App\Http\Controllers\Provider\PaymentController as ProviderPaymentController;
use App\Http\Controllers\Provider\ProfileController as ProviderProfileController;
use App\Http\Controllers\Provider\ServiceController as ProviderServiceController;
use App\Http\Controllers\PublicProviderController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\SimulatedPaymentController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\DisputeController;
use App\Http\Controllers\PayoutController;
use App\Http\Controllers\PayoutMethodController;
use App\Http\Controllers\WalletController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Homepage - Public Marketplace
Route::get('/', [HomeController::class, 'index'])->name('home');

// Static Pages
Route::get('/como-funciona', function () {
    return Inertia::render('HowItWorks');
})->name('how-it-works');

Route::get('/atualizacoes', [HomeController::class, 'updates'])->name('updates');

// Client Dashboard
Route::get('/dashboard', [ClientDashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'user.type:'.User::TYPE_CLIENT])
    ->name('dashboard');

// Provider Routes
Route::middleware(['auth', 'verified', 'user.type:'.User::TYPE_PROVIDER])->prefix('provider')->name('provider.')->group(function () {
    Route::get('/dashboard', [ProviderDashboardController::class, 'index'])->name('dashboard');
    Route::get('/profile', [ProviderProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProviderProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/kyc', [ProviderProfileController::class, 'submitKyc'])->name('profile.kyc');

    // Services
    Route::resource('services', ProviderServiceController::class)->except(['show']);

    // Payments & Highlights
    Route::get('/services/{service}/highlight', [ProviderPaymentController::class, 'plans'])->name('payments.plans');
    Route::post('/services/{service}/highlight', [ProviderPaymentController::class, 'checkout'])->name('payments.checkout');
    Route::get('/payments', [ProviderPaymentController::class, 'history'])->name('payments.history');

    // Earnings History
    Route::get('/earnings', [ProviderEarningsController::class, 'index'])->name('earnings');
    Route::get('/earnings/export', [ProviderEarningsController::class, 'exportPdf'])->name('earnings.export');

    // Wallet & Payouts
    Route::get('/wallet', [PayoutController::class, 'index'])->name('wallet');
    Route::get('/payouts/create', [PayoutController::class, 'create'])->name('payouts.create');
    Route::post('/payouts', [PayoutController::class, 'store'])->name('payouts.store');
    Route::get('/payouts/{payout}', [PayoutController::class, 'show'])->name('payouts.show');
    Route::post('/payouts/{payout}/cancel', [PayoutController::class, 'cancel'])->name('payouts.cancel');

    // Payout Methods
    Route::get('/payout-methods', [PayoutMethodController::class, 'index'])->name('payout-methods.index');
    Route::get('/payout-methods/create', [PayoutMethodController::class, 'create'])->name('payout-methods.create');
    Route::post('/payout-methods', [PayoutMethodController::class, 'store'])->name('payout-methods.store');
    Route::get('/payout-methods/{payoutMethod}/edit', [PayoutMethodController::class, 'edit'])->name('payout-methods.edit');
    Route::patch('/payout-methods/{payoutMethod}', [PayoutMethodController::class, 'update'])->name('payout-methods.update');
    Route::delete('/payout-methods/{payoutMethod}', [PayoutMethodController::class, 'destroy'])->name('payout-methods.destroy');
    Route::post('/payout-methods/{payoutMethod}/default', [PayoutMethodController::class, 'setDefault'])->name('payout-methods.set-default');
});

// Public Service Routes
Route::get('/services', [ServiceController::class, 'index'])->name('services.index');
Route::get('/services/{service}', [ServiceController::class, 'show'])->name('services.show');
Route::post('/services/{service}/track-click', [ServiceController::class, 'trackClick'])->name('services.track-click');
Route::post('/recommendations/{provider}/click', [ServiceController::class, 'recommendationClick'])->name('recommendations.click');

// Public Provider Routes
Route::get('/prestadores', [PublicProviderController::class, 'index'])->name('providers.index');
Route::get('/prestador/{provider}', [PublicProviderController::class, 'show'])->name('providers.show');

// Payment Routes
Route::middleware('auth')->group(function () {
    Route::get('/payments/{payment}/success', [ProviderPaymentController::class, 'success'])->name('payments.success');
    Route::get('/payments/{payment}/cancel', [ProviderPaymentController::class, 'cancel'])->name('payments.cancel');
});

// Simulated Payment Routes (demonstração; exigem sessão e dono do pagamento)
Route::middleware('auth')->group(function () {
    Route::get('/payments/simulate/{payment}', [SimulatedPaymentController::class, 'checkout'])->name('payments.simulate.checkout');
    Route::post('/payments/simulate/{payment}/confirm', [SimulatedPaymentController::class, 'confirm'])->name('payments.simulate.confirm');
    Route::post('/payments/simulate/{payment}/fail', [SimulatedPaymentController::class, 'fail'])->name('payments.simulate.fail');
});

// Webhook Routes (no CSRF verification needed)
Route::post('/webhooks/stripe', [WebhookController::class, 'stripe'])->name('webhooks.stripe');
Route::post('/webhooks/stripe/wallet', [WebhookController::class, 'stripeWallet'])->name('webhooks.stripe.wallet');
Route::post('/webhooks/simulated', [WebhookController::class, 'simulated'])->name('webhooks.simulated');

// Messages Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount'])->name('messages.unread-count');
    Route::get('/messages/{conversation}', [MessageController::class, 'show'])->name('messages.show');
    Route::post('/messages/{conversation}', [MessageController::class, 'store'])->name('messages.store');
    Route::post('/messages/{conversation}/read', [MessageController::class, 'markAsRead'])->name('messages.read');
    Route::post('/services/{service}/contact', [MessageController::class, 'startFromService'])->name('services.contact');
});

// Notification Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
});

// Common authenticated routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Orders Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');
    Route::post('/orders/service/{service}', [OrderController::class, 'createFromService'])->name('orders.create-from-service');
    Route::post('/orders/{order}/accept', [OrderController::class, 'accept'])->name('orders.accept');
    Route::post('/orders/{order}/start', [OrderController::class, 'start'])->name('orders.start');
    Route::post('/orders/{order}/deliver', [OrderController::class, 'deliver'])->name('orders.deliver');
    Route::post('/orders/{order}/complete', [OrderController::class, 'complete'])->name('orders.complete');
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
    Route::post('/orders/{order}/dispute', [OrderController::class, 'dispute'])->name('orders.dispute');
    Route::get('/orders/pending-count', [OrderController::class, 'pendingCount'])->name('orders.pending-count');

    // Timer Routes
    Route::post('/orders/{order}/timer/start', [OrderController::class, 'startTimer'])->name('orders.timer.start');
    Route::post('/orders/{order}/timer/pause', [OrderController::class, 'pauseTimer'])->name('orders.timer.pause');
    Route::post('/orders/{order}/timer/resume', [OrderController::class, 'resumeTimer'])->name('orders.timer.resume');
    Route::post('/orders/{order}/timer/stop', [OrderController::class, 'stopTimer'])->name('orders.timer.stop');
    Route::get('/orders/{order}/timer/status', [OrderController::class, 'timerStatus'])->name('orders.timer.status');
    Route::get('/orders/{order}/timer/breakdown', [OrderController::class, 'timerBreakdown'])->name('orders.timer.breakdown');
    Route::post('/orders/{order}/timer/dispute', [OrderController::class, 'disputeTimer'])->name('orders.timer.dispute');

    // Task Routes
    Route::get('/orders/{order}/tasks', [OrderTaskController::class, 'index'])->name('orders.tasks.index');
    Route::post('/orders/{order}/tasks', [OrderTaskController::class, 'store'])->name('orders.tasks.store');
    Route::patch('/orders/{order}/tasks/{task}', [OrderTaskController::class, 'update'])->name('orders.tasks.update');
    Route::delete('/orders/{order}/tasks/{task}', [OrderTaskController::class, 'destroy'])->name('orders.tasks.destroy');
    Route::post('/orders/{order}/tasks/{task}/toggle', [OrderTaskController::class, 'toggleStatus'])->name('orders.tasks.toggle');
});

// Reviews Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::get('/reviews/create/{service}', [ReviewController::class, 'create'])->name('reviews.create');
    Route::get('/reviews/provider/{provider}', [ReviewController::class, 'createForProvider'])->name('reviews.create-provider');
    Route::post('/reviews', [ReviewController::class, 'store'])->name('reviews.store');
    Route::post('/reviews/provider', [ReviewController::class, 'storeForProvider'])->name('reviews.store-provider');
    Route::get('/reviews/{review}/edit', [ReviewController::class, 'edit'])->name('reviews.edit');
    Route::patch('/reviews/{review}', [ReviewController::class, 'update'])->name('reviews.update');
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy'])->name('reviews.destroy');
    Route::post('/reviews/{review}/respond', [ReviewController::class, 'respond'])->name('reviews.respond');
});

// Wishlist Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/{service}', [WishlistController::class, 'store'])->name('wishlist.store');
    Route::delete('/wishlist/{service}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');
});

// Wallet Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index');
    Route::get('/wallet/top-up', [WalletController::class, 'topUpForm'])->name('wallet.top-up');
    Route::post('/wallet/top-up', [WalletController::class, 'processTopUp'])->name('wallet.top-up.process');
    Route::get('/wallet/top-up/success', [WalletController::class, 'topUpSuccess'])->name('wallet.top-up.success');
    Route::get('/wallet/top-up/cancel', [WalletController::class, 'topUpCancel'])->name('wallet.top-up.cancel');
    Route::get('/wallet/balance', [WalletController::class, 'getBalance'])->name('wallet.balance');
    Route::post('/wallet/check-balance', [WalletController::class, 'checkBalance'])->name('wallet.check-balance');
    Route::get('/wallet/transactions/{reference}', [WalletController::class, 'showTransaction'])->name('wallet.transactions.show');
});

// Disputes Routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/disputes', [DisputeController::class, 'index'])->name('disputes.index');
    Route::get('/disputes/create/{order}', [DisputeController::class, 'create'])->name('disputes.create');
    Route::post('/disputes', [DisputeController::class, 'store'])->name('disputes.store');
    Route::get('/disputes/{dispute}', [DisputeController::class, 'show'])->name('disputes.show');
    Route::post('/disputes/{dispute}/respond', [DisputeController::class, 'respond'])->name('disputes.respond');
    Route::post('/disputes/{dispute}/cancel', [DisputeController::class, 'cancel'])->name('disputes.cancel');
});

// API endpoint for service reviews (public)
Route::get('/api/services/{service}/reviews', [ReviewController::class, 'serviceReviews'])->name('api.services.reviews');

require __DIR__.'/auth.php';
