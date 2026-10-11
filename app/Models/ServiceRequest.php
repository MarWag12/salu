<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ServiceRequest extends Model
{
    public const PENDENTE = 'pendente';
    public const ATRIBUIDO = 'atribuido';
    public const EM_CURSO = 'em_curso';
    public const CONCLUIDO = 'concluido';
    public const CANCELADO = 'cancelado';

    public const STATUSES = [
        self::PENDENTE => ['Pendente', 'warning'],
        self::ATRIBUIDO => ['Atribuído', 'info'],
        self::EM_CURSO => ['Em curso', 'primary'],
        self::CONCLUIDO => ['Concluído', 'success'],
        self::CANCELADO => ['Cancelado', 'danger'],
    ];

    protected $fillable = [
        'code', 'client_id', 'service_id', 'technician_id', 'address', 'municipality',
        'scheduled_at', 'description', 'status', 'price', 'cancel_reason', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'price' => 'decimal:2',
        ];
    }

    public static function generateCode(): string
    {
        do {
            $code = 'CAF-'.now()->format('ymd').'-'.random_int(1000, 9999);
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(Technician::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class);
    }

    public function statusLabel(): string
    {
        return self::STATUSES[$this->status][0] ?? $this->status;
    }

    public function statusColor(): string
    {
        return self::STATUSES[$this->status][1] ?? 'muted';
    }

    public function isPaid(): bool
    {
        return $this->payments()->where('status', Payment::CONFIRMADO)->exists();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::PENDENTE, self::ATRIBUIDO], true);
    }
}
