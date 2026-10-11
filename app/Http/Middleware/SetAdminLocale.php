<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** O Filament traz traduções em pt_PT (não em "pt"); as mensagens da app continuam em lang/pt (locale de recurso). */
class SetAdminLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        app()->setLocale('pt_PT');

        return $next($request);
    }
}
