<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register', [
            'userTypes' => [
                ['value' => User::TYPE_CLIENT, 'label' => 'Cliente - Procuro serviços'],
                ['value' => User::TYPE_PROVIDER, 'label' => 'Prestador - Ofereço serviços'],
            ],
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'user_type' => ['required', Rule::in([User::TYPE_CLIENT, User::TYPE_PROVIDER])],
        ]);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'type' => $request->user_type,
                'is_active' => true,
            ]);

            // Create ServiceProvider profile if registering as provider
            if ($request->user_type === User::TYPE_PROVIDER) {
                ServiceProvider::create([
                    'user_id' => $user->id,
                ]);
            }

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return redirect($this->getRedirectRoute($user));
    }

    /**
     * Get the redirect route based on user type.
     */
    protected function getRedirectRoute(User $user): string
    {
        return match ($user->type) {
            User::TYPE_ADMIN => route('filament.admin.pages.dashboard', absolute: false),
            User::TYPE_PROVIDER => route('provider.dashboard', absolute: false),
            default => route('services.index', absolute: false), // Clientes vão explorar serviços
        };
    }
}
