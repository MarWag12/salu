<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletHold extends Model
{
    use HasFactory;

    /**
     * Hold statuses.
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_RELEASED = 'released';
    const STATUS_REVERSED = 'reversed';

    protected $fillable = [
        'wallet_id',
        'order_id',
        'transaction_id',
        'amount',
        'status',
        'released_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'released_at' => 'datetime',
    ];

    /**
     * Get the wallet that owns the hold.
     */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Get the order associated with this hold.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the transaction that created this hold.
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(WalletTransaction::class, 'transaction_id');
    }

    /**
     * Check if hold is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if hold is released.
     */
    public function isReleased(): bool
    {
        return $this->status === self::STATUS_RELEASED;
    }

    /**
     * Check if hold is reversed.
     */
    public function isReversed(): bool
    {
        return $this->status === self::STATUS_REVERSED;
    }

    /**
     * Get formatted amount for display.
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2, ',', '.') . ' AOA';
    }

    /**
     * Get status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Ativo',
            self::STATUS_RELEASED => 'Liberado',
            self::STATUS_REVERSED => 'Revertido',
            default => 'Desconhecido',
        };
    }

    /**
     * Get status color for UI.
     */
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'yellow',
            self::STATUS_RELEASED => 'green',
            self::STATUS_REVERSED => 'gray',
            default => 'gray',
        };
    }

    /**
     * Get duration in days since hold was created.
     */
    public function getDurationInDaysAttribute(): int
    {
        if ($this->released_at) {
            return $this->created_at->diffInDays($this->released_at);
        }

        return $this->created_at->diffInDays(now());
    }

    /**
     * Scope to get active holds only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to get released holds only.
     */
    public function scopeReleased($query)
    {
        return $query->where('status', self::STATUS_RELEASED);
    }

    /**
     * Scope to get reversed holds only.
     */
    public function scopeReversed($query)
    {
        return $query->where('status', self::STATUS_REVERSED);
    }

    /**
     * Scope to get holds by order.
     */
    public function scopeByOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }
}
