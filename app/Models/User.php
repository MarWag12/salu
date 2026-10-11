<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements FilamentUser
{
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_TECNICO = 'tecnico';
    public const ROLE_CLIENTE = 'cliente';

    protected $fillable = ['name', 'email', 'phone', 'role', 'active', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'active' => 'boolean',
        ];
    }

    public function technician(): HasOne
    {
        return $this->hasOne(Technician::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'client_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isTecnico(): bool
    {
        return $this->role === self::ROLE_TECNICO;
    }

    public function isCliente(): bool
    {
        return $this->role === self::ROLE_CLIENTE;
    }

    public function roleLabel(): string
    {
        return match ($this->role) {
            self::ROLE_ADMIN => 'Administrador',
            self::ROLE_TECNICO => 'Técnico',
            default => 'Cliente',
        };
    }

    /** Só administradores activos entram no painel Filament (/admin). */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isAdmin() && $this->active;
    }

    public function homeRoute(): string
    {
        return match ($this->role) {
            self::ROLE_ADMIN => url('/admin'),
            self::ROLE_TECNICO => route('tecnico.dashboard'),
            default => route('cliente.dashboard'),
        };
    }

    public function initials(): string
    {
        $parts = preg_split('/\s+/', trim($this->name));
        $first = mb_substr($parts[0] ?? '', 0, 1);
        $last = count($parts) > 1 ? mb_substr(end($parts), 0, 1) : '';

        return mb_strtoupper($first.$last);
    }
}
