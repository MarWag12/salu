<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasFactory;

    /**
     * Transaction types.
     */
    const TYPE_TOP_UP = 'top_up';
    const TYPE_ORDER_PAYMENT = 'order_payment';
    const TYPE_ESCROW_RELEASE = 'escrow_release';
    const TYPE_REFUND = 'refund';
    const TYPE_PLATFORM_FEE = 'platform_fee';
    const TYPE_WITHDRAWAL = 'withdrawal';

    /**
     * Transaction statuses.
     */
    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_REVERSED = 'reversed';

    protected $fillable = [
        'reference',
        'wallet_id',
        'related_user_id',
        'order_id',
        'type',
        'amount',
        'balance_before',
        'balance_after',
        'status',
        'description',
        'metadata',
        'completed_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'metadata' => 'array',
        'completed_at' => 'datetime',
    ];

    /**
     * Prevent updates to transactions (immutable ledger).
     */
    protected static function boot()
    {
        parent::boot();

        static::updating(function ($transaction) {
            // Allow only status updates for pending transactions
            if ($transaction->isDirty() && !$transaction->isDirty('status')) {
                throw new \Exception('Transactions are immutable and cannot be updated.');
            }
        });
    }

    /**
     * Get the wallet that owns the transaction.
     */
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    /**
     * Get the related user (for transfers/payments).
     */
    public function relatedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'related_user_id');
    }

    /**
     * Get the order associated with this transaction.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Check if transaction is a credit (positive amount).
     */
    public function isCreditAttribute(): bool
    {
        return $this->amount > 0;
    }

    /**
     * Check if transaction is a debit (negative amount).
     */
    public function isDebitAttribute(): bool
    {
        return $this->amount < 0;
    }

    /**
     * Get formatted amount for display.
     */
    public function getFormattedAmountAttribute(): string
    {
        $formatted = number_format(abs($this->amount), 2, ',', '.');
        $prefix = $this->amount >= 0 ? '+' : '-';

        return $prefix . ' ' . $formatted . ' AOA';
    }

    /**
     * Get transaction type label.
     */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_TOP_UP => 'Recarga',
            self::TYPE_ORDER_PAYMENT => 'Pagamento de Pedido',
            self::TYPE_ESCROW_RELEASE => 'Liberação de Escrow',
            self::TYPE_REFUND => 'Reembolso',
            self::TYPE_PLATFORM_FEE => 'Taxa da Plataforma',
            self::TYPE_WITHDRAWAL => 'Saque',
            default => 'Outro',
        };
    }

    /**
     * Get status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pendente',
            self::STATUS_COMPLETED => 'Concluído',
            self::STATUS_FAILED => 'Falhou',
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
            self::STATUS_PENDING => 'yellow',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_FAILED => 'red',
            self::STATUS_REVERSED => 'gray',
            default => 'gray',
        };
    }

    /**
     * Scope to get completed transactions only.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope to get transactions by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get credit transactions.
     */
    public function scopeCredits($query)
    {
        return $query->where('amount', '>', 0);
    }

    /**
     * Scope to get debit transactions.
     */
    public function scopeDebits($query)
    {
        return $query->where('amount', '<', 0);
    }
}
