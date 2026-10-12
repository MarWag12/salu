<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Technician;
use App\Models\User;
use App\Support\Present;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($data, $request->boolean('remember'))) {
            return back()->withErrors(['email' => 'E-mail ou palavra-passe incorrectos.'])->onlyInput('email');
        }

        if (! Auth::user()->active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return back()->withErrors(['email' => 'A sua conta está desactivada. Contacte a Salu.'])->onlyInput('email');
        }

        $request->session()->regenerate();
        AuditLog::record('login', 'Início de sessão');

        return $this->afterAuth($request, Auth::user());
    }

    public function showRegister(Request $request)
    {
        return Inertia::render('Auth/Register', [
            'tipo' => $request->query('tipo') === 'tecnico' ? 'tecnico' : 'cliente',
            'categories' => Category::active()->orderBy('name')->get()->map(fn ($c) => Present::category($c)),
        ]);
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'tipo' => ['required', 'in:cliente,tecnico'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
            'municipality' => ['required_if:tipo,tecnico', 'nullable', 'string', 'max:120'],
            'experience_years' => ['nullable', 'integer', 'min:0', 'max:60'],
            'categories' => ['required_if:tipo,tecnico', 'nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => $data['tipo'] === 'tecnico' ? User::ROLE_TECNICO : User::ROLE_CLIENTE,
            'password' => $data['password'],
        ]);

        if ($user->isTecnico()) {
            $tech = Technician::create([
                'user_id' => $user->id,
                'municipality' => $data['municipality'] ?? null,
                'experience_years' => $data['experience_years'] ?? 0,
            ]);
            $tech->categories()->sync($data['categories'] ?? []);
        }

        Auth::login($user);
        $request->session()->regenerate();
        AuditLog::record('registo', 'Nova conta criada ('.$user->roleLabel().')');

        return redirect($user->homeRoute())->with('success', 'Conta criada com sucesso. Bem-vindo à Salu!');
    }

    public function logout(Request $request)
    {
        AuditLog::record('logout', 'Fim de sessão');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    /** Redireciona após login; o painel Filament (/admin) não é uma página Inertia, por isso precisa de uma visita completa. */
    protected function afterAuth(Request $request, User $user)
    {
        $url = $request->session()->pull('url.intended', $user->homeRoute());
        $path = parse_url($url, PHP_URL_PATH) ?: '/';

        if (! $user->isAdmin() && str_starts_with($path, '/admin')) {
            $url = $user->homeRoute();
        }

        return str_starts_with($path, '/admin') && $user->isAdmin()
            ? Inertia::location($url)
            : redirect($url);
    }

    // ---- Recuperação de palavra-passe ----

    public function showForgot()
    {
        return Inertia::render('Auth/Forgot');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink($request->only('email'));

        // Resposta neutra para não revelar que e-mails existem.
        return back()->with('success', 'Se o e-mail existir, enviámos as instruções de recuperação.');
    }

    public function showReset(Request $request, string $token)
    {
        return Inertia::render('Auth/Reset', ['token' => $token, 'email' => $request->query('email')]);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('success', 'Palavra-passe redefinida. Já pode entrar.')
            : back()->withErrors(['email' => 'O link de recuperação é inválido ou expirou.']);
    }
}
