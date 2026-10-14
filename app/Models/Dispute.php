<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dispute extends Model
{
    use Auditable;
    protected $fillable = [
        'order_id',
        'client_id',
        'provider_id',
        'reason',
        'description',
        'status',
        'resolution_notes',
        'resolved_at',
        'resolved_by',
        'refund_amount',
        'evidence',
        'provider_response',
        'provider_responded_at',
    ];

    protected $casts = [
        'evidence' => 'array',
        'provider_response' => 'array',
        'resolved_at' => 'datetime',
        'provider_responded_at' => 'datetime',
        'refund_amount' => 'decimal:2',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_RESOLVED_CLIENT = 'resolved_client_favor';
    const STATUS_RESOLVED_PROVIDER = 'resolved_provider_favor';
    const STATUS_CANCELLED = 'cancelled';

    const REASON_QUALITY = 'quality';
    const REASON_NOT_DELIVERED = 'not_delivered';
    const REASON_NOT_AS_DESCRIBED = 'not_as_described';
    const REASON_COMMUNICATION = 'communication';
    const REASON_OTHER = 'other';

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class, 'provider_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isUnderReview(): bool
    {
        return $this->status === self::STATUS_UNDER_REVIEW;
    }

    public function isResolved(): bool
    {
        return in_array($this->status, [
            self::STATUS_RESOLVED_CLIENT,
            self::STATUS_RESOLVED_PROVIDER,
        ]);
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public static function getReasons(): array
    {
        return [
            self::REASON_QUALITY => 'Qualidade do serviço',
            self::REASON_NOT_DELIVERED => 'Serviço não entregue',
            self::REASON_NOT_AS_DESCRIBED => 'Serviço diferente do descrito',
            self::REASON_COMMUNICATION => 'Problemas de comunicação',
            self::REASON_OTHER => 'Outro motivo',
        ];
    }

    public static function getStatuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pendente',
            self::STATUS_UNDER_REVIEW => 'Em análise',
            self::STATUS_RESOLVED_CLIENT => 'Resolvido (favor do cliente)',
            self::STATUS_RESOLVED_PROVIDER => 'Resolvido (favor do prestador)',
            self::STATUS_CANCELLED => 'Cancelado',
        ];
    }
}
