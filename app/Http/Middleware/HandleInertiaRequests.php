<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /** Vista Blade raiz que contém o <div id="app"> do Inertia. */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /** Dados partilhados com TODAS as páginas React. */
    public function share(Request $request): array
    {
        $user = $request->user();

        return array_merge(parent::share($request), [
            'app' => ['name' => config('app.name')],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'role_label' => $user->roleLabel(),
                    'initials' => $user->initials(),
                    'home' => $user->homeRoute(),
                    // Para filtrar notificações em tempo real de novos pedidos.
                    'category_ids' => $user->isTecnico()
                        ? ($user->technician?->categories()->pluck('categories.id')->all() ?? [])
                        : [],
                ] : null,
            ],
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            // Só há tempo real se o broadcasting estiver configurado no servidor.
            'realtime' => (bool) config('broadcasting.default') && ! in_array(config('broadcasting.default'), ['null', 'log'], true),
        ]);
    }
}
