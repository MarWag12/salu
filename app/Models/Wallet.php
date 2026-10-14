<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'balance',
        'available_balance',
        'held_balance',
        'currency',
        'is_active',
        'last_transaction_at',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'available_balance' => 'decimal:2',
        'held_balance' => 'decimal:2',
        'is_active' => 'boolean',
        'last_transaction_at' => 'datetime',
    ];

    /**
     * Get the user that owns the wallet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all transactions for this wallet.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    /**
     * Get all active holds for this wallet.
     */
    public function holds(): HasMany
    {
        return $this->hasMany(WalletHold::class);
    }

    /**
     * Get active holds only.
     */
    public function activeHolds(): HasMany
    {
        return $this->holds()->where('status', 'active');
    }

    /**
     * Check if wallet has sufficient available balance.
     */
    public function hasSufficientBalance(float $amount): bool
    {
        return $this->available_balance >= $amount;
    }

    /**
     * Get the total amount currently held in escrow.
     */
    public function getTotalHeldAttribute(): float
    {
        return (float) $this->activeHolds()->sum('amount');
    }

    /**
     * Get formatted balance for display.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return number_format($this->balance, 2, ',', '.') . ' ' . $this->currency;
    }

    /**
     * Get formatted available balance for display.
     */
    public function getFormattedAvailableBalanceAttribute(): string
    {
        return number_format($this->available_balance, 2, ',', '.') . ' ' . $this->currency;
    }

    /**
     * Get formatted held balance for display.
     */
    public function getFormattedHeldBalanceAttribute(): string
    {
        return number_format($this->held_balance, 2, ',', '.') . ' ' . $this->currency;
    }

    /**
     * Scope to get active wallets only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get wallets by currency.
     */
    public function scopeByCurrency($query, string $currency)
    {
        return $query->where('currency', $currency);
    }
}
