<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserType
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$types
     */
    public function handle(Request $request, Closure $next, string ...$types): Response
    {
        $user = $request->user();

        if (!$user || !in_array($user->type, $types)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Acesso não autorizado.'], 403);
            }

            return redirect($this->getRedirectRoute($user));
        }

        return $next($request);
    }

    /**
     * Get the redirect route based on user type.
     */
    protected function getRedirectRoute(?User $user): string
    {
        if (!$user) {
            return route('login');
        }

        return match ($user->type) {
            User::TYPE_ADMIN => route('filament.admin.pages.dashboard'),
            User::TYPE_PROVIDER => route('provider.dashboard'),
            default => route('dashboard'),
        };
    }
}
