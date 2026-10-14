<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderTimeEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'type',
        'logged_at',
        'elapsed_seconds',
        'notes',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'logged_at' => 'datetime',
            'elapsed_seconds' => 'integer',
            'metadata' => 'array',
        ];
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
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * Helper methods
     */
    public function isStart(): bool
    {
        return $this->type === 'start';
    }

    public function isPause(): bool
    {
        return $this->type === 'pause';
    }

    public function isResume(): bool
    {
        return $this->type === 'resume';
    }

    public function isStop(): bool
    {
        return $this->type === 'stop';
    }

    public function isDispute(): bool
    {
        return $this->type === 'dispute';
    }
}
