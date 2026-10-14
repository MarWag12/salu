<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements FilamentUser, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    const TYPE_ADMIN = 'admin';
    const TYPE_CLIENT = 'client';
    const TYPE_PROVIDER = 'provider';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'type',
        'phone',
        'avatar',
        'bio',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'is_active',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * A confirmação de e-mail só é exigida quando SALU_REQUIRE_EMAIL_VERIFICATION=true
     * (requer um serviço de e-mail configurado). Caso contrário a conta fica activa de imediato.
     */
    public function hasVerifiedEmail(): bool
    {
        if (!config('salu.require_email_verification')) {
            return true;
        }

        return $this->email_verified_at !== null;
    }

    public function sendEmailVerificationNotification(): void
    {
        if (config('salu.require_email_verification')) {
            $this->notify(new \Illuminate\Auth\Notifications\VerifyEmail);
        }
    }

    /**
     * Check if user can access Filament panel
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return $this->isAdmin() && $this->is_active;
    }

    /**
     * Get the service provider profile associated with the user.
     */
    public function serviceProvider(): HasOne
    {
        return $this->hasOne(ServiceProvider::class);
    }

    /**
     * Get reviews written by this user.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get orders placed by this user (as client).
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'client_id');
    }

    /**
     * Get conversations where user is the client.
     */
    public function clientConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'client_id');
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->type === self::TYPE_ADMIN;
    }

    /**
     * Check if user is client
     */
    public function isClient(): bool
    {
        return $this->type === self::TYPE_CLIENT;
    }

    /**
     * Check if user is service provider
     */
    public function isProvider(): bool
    {
        return $this->type === self::TYPE_PROVIDER;
    }

    /**
     * Get user type label
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_ADMIN => 'Administrador',
            self::TYPE_CLIENT => 'Cliente',
            self::TYPE_PROVIDER => 'Prestador',
            default => 'Desconhecido',
        };
    }

    /**
     * Get full address
     */
    public function getFullAddressAttribute(): ?string
    {
        $parts = array_filter([
            $this->address,
            $this->city,
            $this->state,
            $this->postal_code,
            $this->country,
        ]);

        return !empty($parts) ? implode(', ', $parts) : null;
    }

    /**
     * Route notifications for the SMS channel.
     */
    public function routeNotificationForSms(): ?string
    {
        return $this->phone;
    }

    /**
     * Route notifications for the WhatsApp channel.
     */
    public function routeNotificationForWhatsapp(): ?string
    {
        return $this->phone;
    }

    /**
     * Get disputes created by this user (as client).
     */
    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'client_id');
    }
}
