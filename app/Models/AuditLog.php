<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    public const ACTION_CREATE = 'create';
    public const ACTION_UPDATE = 'update';
    public const ACTION_DELETE = 'delete';
    public const ACTION_STATUS_CHANGE = 'status_change';
    public const ACTION_PAYMENT = 'payment';
    public const ACTION_PAYOUT = 'payout';
    public const ACTION_DISPUTE = 'dispute';
    public const ACTION_KYC = 'kyc';
    public const ACTION_LOGIN = 'login';
    public const ACTION_LOGOUT = 'logout';

    protected $fillable = [
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'metadata',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the user that performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auditable model.
     */
    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope for filtering by action type.
     */
    public function scopeOfAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope for filtering by model type.
     */
    public function scopeForModel($query, string $modelClass)
    {
        return $query->where('auditable_type', $modelClass);
    }

    /**
     * Scope for filtering by user.
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Get human-readable action name.
     */
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_CREATE => 'Criação',
            self::ACTION_UPDATE => 'Atualização',
            self::ACTION_DELETE => 'Eliminação',
            self::ACTION_STATUS_CHANGE => 'Mudança de Estado',
            self::ACTION_PAYMENT => 'Pagamento',
            self::ACTION_PAYOUT => 'Levantamento',
            self::ACTION_DISPUTE => 'Disputa',
            self::ACTION_KYC => 'Verificação KYC',
            self::ACTION_LOGIN => 'Login',
            self::ACTION_LOGOUT => 'Logout',
            default => $this->action,
        };
    }
}
