<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Autorização dos canais privados (Laravel Echo / Reverb): POST /broadcasting/auth
    ->withBroadcasting(__DIR__.'/../routes/channels.php', ['middleware' => ['web', 'auth']])
    ->withMiddleware(function (Middleware $middleware): void {
        // Render (e outros PaaS) terminam o HTTPS no proxy: confiar nos cabeçalhos X-Forwarded-*.
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [HandleInertiaRequests::class]);
        $middleware->alias(['role' => EnsureRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Páginas de erro em React (403/404/500/503). O painel Filament e o Livewire mantêm as suas.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();

            if (
                in_array($status, [403, 404, 500, 503], true)
                && ! $request->is('admin', 'admin/*', 'livewire/*', 'broadcasting/*')
                && ! $request->expectsJson()
                && ! (app()->environment('local') && $status === 500)
            ) {
                $message = $e instanceof HttpExceptionInterface ? $e->getMessage() : '';

                return Inertia::render('Error', ['status' => $status, 'message' => $message])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
