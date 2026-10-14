<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class OrderTimerSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'session_token',
        'started_at',
        'paused_at',
        'resumed_at',
        'stopped_at',
        'active_duration_seconds',
        'paused_duration_seconds',
        'status',
        'is_current',
        'stop_reason',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'paused_at' => 'datetime',
            'resumed_at' => 'datetime',
            'stopped_at' => 'datetime',
            'active_duration_seconds' => 'integer',
            'paused_duration_seconds' => 'integer',
            'is_current' => 'boolean',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            if (empty($session->session_token)) {
                $session->session_token = self::generateToken();
            }
        });
    }

    /**
     * Generate unique session token.
     */
    public static function generateToken(): string
    {
        do {
            $token = 'TIMER-' . strtoupper(Str::random(16));
        } while (self::where('session_token', $token)->exists());

        return $token;
    }

    /**
     * Relationships
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Scopes
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePaused($query)
    {
        return $query->where('status', 'paused');
    }

    public function scopeStopped($query)
    {
        return $query->where('status', 'stopped');
    }

    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * Status helpers
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPaused(): bool
    {
        return $this->status === 'paused';
    }

    public function isStopped(): bool
    {
        return $this->status === 'stopped';
    }

    /**
     * Calculate total duration in seconds.
     */
    public function getTotalDurationSeconds(): int
    {
        return $this->active_duration_seconds;
    }

    /**
     * Calculate current active time if session is running.
     */
    public function getCurrentActiveSeconds(): int
    {
        if ($this->isStopped()) {
            return $this->active_duration_seconds;
        }

        $baseSeconds = $this->active_duration_seconds;

        if ($this->isActive() && $this->started_at) {
            // Calculate time since last start/resume
            $lastActionTime = $this->resumed_at ?? $this->started_at;
            $baseSeconds += (int) max(0, floor($lastActionTime->diffInSeconds(now())));
        }

        return $baseSeconds;
    }

    /**
     * Format duration as HH:MM:SS.
     */
    public function getFormattedDuration(): string
    {
        $seconds = $this->getCurrentActiveSeconds();
        $hours = floor($seconds / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        $secs = $seconds % 60;

        return sprintf('%02d:%02d:%02d', $hours, $minutes, $secs);
    }
}
