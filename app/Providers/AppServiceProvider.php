<?php

namespace App\Providers;

use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(PaymentGatewayManager::class, function () {
            return new PaymentGatewayManager();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

        Vite::prefetch(concurrency: 3);

        // Parâmetros de id são numéricos: evita que rotas como /orders/pending-count
        // sejam interpretadas como /orders/{order} (erro em PostgreSQL).
        foreach (['conversation', 'dispute', 'order', 'payment', 'payout', 'review', 'task', 'service', 'provider'] as $param) {
            Route::pattern($param, '[0-9]+');
        }
    }
}
