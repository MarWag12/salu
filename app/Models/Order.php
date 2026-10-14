<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'reference',
        'service_id',
        'service_package_id',
        'client_id',
        'provider_id',
        'conversation_id',
        'description',
        'requirements',
        'agreed_price',
        'service_fee',
        'wallet_transaction_id',
        'payment_method',
        'payment_completed',
        'payment_completed_at',
        'hourly_rate',
        'total_work_duration_seconds',
        'calculated_price',
        'timer_validated',
        'currency',
        'expected_delivery_date',
        'status',
        'is_urgent',
        'urgent_fee',
        'urgent_requested_at',
        'timer_active',
        'timer_started_at',
        'timer_last_action_at',
        'timer_pause_count',
        'client_disputed_at',
        'timer_dispute_resolved',
        'accepted_at',
        'started_at',
        'delivered_at',
        'completed_at',
        'cancelled_at',
        'cancellation_reason',
        'dispute_reason',
        'cancelled_by',
        'provider_notes',
        'client_notes',
        'delivery_notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'agreed_price' => 'decimal:2',
            'service_fee' => 'decimal:2',
            'urgent_fee' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'calculated_price' => 'decimal:2',
            'payment_completed' => 'boolean',
            'timer_validated' => 'boolean',
            'payment_completed_at' => 'datetime',
            'is_urgent' => 'boolean',
            'timer_active' => 'boolean',
            'timer_pause_count' => 'integer',
            'timer_dispute_resolved' => 'boolean',
            'expected_delivery_date' => 'date',
            'accepted_at' => 'datetime',
            'started_at' => 'datetime',
            'delivered_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'urgent_requested_at' => 'datetime',
            'timer_started_at' => 'datetime',
            'timer_last_action_at' => 'datetime',
            'client_disputed_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->reference)) {
                $order->reference = self::generateReference();
            }
        });
    }

    /**
     * Generate unique order reference.
     */
    public static function generateReference(): string
    {
        do {
            $reference = 'ORD-' . strtoupper(Str::random(8));
        } while (self::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Relationships
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function servicePackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'service_package_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class, 'provider_id');
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class)->where('review_type', 'service');
    }

    public function reviews(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function serviceReview(): HasOne
    {
        return $this->hasOne(Review::class)->where('review_type', 'service');
    }

    public function providerReview(): HasOne
    {
        return $this->hasOne(Review::class)->where('review_type', 'provider');
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }

    public function activeDispute(): HasOne
    {
        return $this->hasOne(Dispute::class)->whereNotIn('status', [
            Dispute::STATUS_RESOLVED_CLIENT,
            Dispute::STATUS_RESOLVED_PROVIDER,
            Dispute::STATUS_CANCELLED,
        ])->latest();
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(OrderTimeEntry::class);
    }

    public function timerSessions(): HasMany
    {
        return $this->hasMany(OrderTimerSession::class);
    }

    public function currentTimerSession(): HasOne
    {
        return $this->hasOne(OrderTimerSession::class)->where('is_current', true);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(OrderTask::class);
    }

    /**
     * Check if order has been fully reviewed (both service and provider).
     */
    public function hasFullReview(): bool
    {
        return $this->reviews()->where('review_type', 'service')->exists() &&
               $this->reviews()->where('review_type', 'provider')->exists();
    }

    /**
     * Scopes
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeForProvider($query, $providerId)
    {
        return $query->where('provider_id', $providerId);
    }

    public function scopePrioritized($query)
    {
        return $query->orderBy('is_urgent', 'desc')->orderBy('created_at', 'asc');
    }

    public function scopeUrgent($query)
    {
        return $query->where('is_urgent', true);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            OrderStatus::PENDING,
            OrderStatus::ACCEPTED,
            OrderStatus::IN_PROGRESS,
            OrderStatus::DELIVERED,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', OrderStatus::COMPLETED);
    }

    /**
     * Status helpers
     */
    public function isPending(): bool
    {
        return $this->status === OrderStatus::PENDING;
    }

    public function isAccepted(): bool
    {
        return $this->status === OrderStatus::ACCEPTED;
    }

    public function isInProgress(): bool
    {
        return $this->status === OrderStatus::IN_PROGRESS;
    }

    public function isDelivered(): bool
    {
        return $this->status === OrderStatus::DELIVERED;
    }

    public function isCompleted(): bool
    {
        return $this->status === OrderStatus::COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === OrderStatus::CANCELLED;
    }

    public function isDisputed(): bool
    {
        return $this->status === OrderStatus::DISPUTED;
    }

    public function canBeCancelled(): bool
    {
        return $this->status->canBeCancelled();
    }

    public function canBeReviewed(): bool
    {
        return $this->isCompleted() && !$this->hasFullReview();
    }

    /**
     * Check if the order can transition to a given status.
     */
    public function canTransitionTo(OrderStatus $status): bool
    {
        return in_array($status, $this->status->allowedTransitions());
    }

    /**
     * Status transitions
     */
    public function accept(): bool
    {
        if (!$this->isPending()) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::ACCEPTED,
            'accepted_at' => now(),
        ]);

        return true;
    }

    public function start(): bool
    {
        if (!$this->isAccepted()) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::IN_PROGRESS,
            'started_at' => now(),
        ]);

        return true;
    }

    public function deliver(?string $deliveryNotes = null): bool
    {
        if (!$this->isInProgress()) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::DELIVERED,
            'delivered_at' => now(),
            'delivery_notes' => $deliveryNotes,
        ]);

        return true;
    }

    public function complete(): bool
    {
        if (!$this->isDelivered()) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        return true;
    }

    public function cancel(?string $reason = null): bool
    {
        if (!$this->canBeCancelled()) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        return true;
    }

    public function dispute(?string $reason = null): bool
    {
        if (!in_array($this->status, [OrderStatus::IN_PROGRESS, OrderStatus::DELIVERED])) {
            return false;
        }

        $this->update([
            'status' => OrderStatus::DISPUTED,
            'dispute_reason' => $reason,
        ]);

        return true;
    }

    /**
     * Formatted price attribute.
     */
    public function getFormattedPriceAttribute(): string
    {
        if (!$this->agreed_price) {
            return 'A combinar';
        }

        return number_format($this->agreed_price, 2, ',', '.') . ' ' . $this->currency;
    }
}
