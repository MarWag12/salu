<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'provider_id',
        'service_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at');
    }

    public function latestMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    public function unreadMessagesFor(User $user): int
    {
        return $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    public function markAsReadFor(User $user): void
    {
        $this->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function getOtherParticipant(User $user): User
    {
        return $user->id === $this->client_id ? $this->provider : $this->client;
    }

    public function scopeForUser($query, User $user)
    {
        return $query->where(function ($q) use ($user) {
            $q->where('client_id', $user->id)
              ->orWhere('provider_id', $user->id);
        });
    }

    public function scopeWithUnreadFor($query, User $user)
    {
        return $query->whereHas('messages', function ($q) use ($user) {
            $q->where('sender_id', '!=', $user->id)
              ->whereNull('read_at');
        });
    }

    public static function findOrCreateBetween(User $client, User $provider, ?Service $service = null): self
    {
        return self::firstOrCreate(
            [
                'client_id' => $client->id,
                'provider_id' => $provider->id,
                'service_id' => $service?->id,
            ]
        );
    }
}
