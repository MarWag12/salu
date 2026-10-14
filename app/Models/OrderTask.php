<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'task_type',
        'description',
        'location',
        'duration_minutes',
        'value_charged',
        'status',
        'completed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
            'value_charged' => 'decimal:2',
            'completed_at' => 'datetime',
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
    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('task_type', $type);
    }

    /**
     * Status helpers
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Mark task as in progress.
     */
    public function markInProgress(): void
    {
        $this->update(['status' => 'in_progress']);
    }

    /**
     * Mark task as completed.
     */
    public function markCompleted(): void
    {
        $this->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Get formatted duration.
     */
    public function getFormattedDuration(): string
    {
        if (!$this->duration_minutes) {
            return '-';
        }

        $hours = floor($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0) {
            return $minutes > 0
                ? "{$hours}h {$minutes}min"
                : "{$hours}h";
        }

        return "{$minutes}min";
    }

    /**
     * Get formatted value.
     */
    public function getFormattedValue(): string
    {
        if (!$this->value_charged) {
            return '-';
        }

        return number_format($this->value_charged, 2, ',', '.') . ' AOA';
    }
}
