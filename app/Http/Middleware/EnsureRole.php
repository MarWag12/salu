<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe uma rota a um ou mais papéis: EnsureRole::class.':admin' ou ':admin,tecnico'.
 * Também bloqueia contas desactivadas.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->active) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors(['email' => 'A sua conta está desactivada. Contacte a Salu.']);
        }

        if (! in_array($user->role, $roles, true)) {
            abort(403, 'Não tem permissão para aceder a esta área.');
        }

        return $next($request);
    }
}
