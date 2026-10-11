<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    public const PENDENTE = 'pendente';
    public const CONFIRMADO = 'confirmado';

    public const METHODS = [
        'numerario' => 'Numerário',
        'transferencia' => 'Transferência bancária',
        'multicaixa' => 'Multicaixa Express',
    ];

    protected $fillable = ['service_request_id', 'amount', 'method', 'reference', 'status', 'confirmed_at'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'confirmed_at' => 'datetime'];
    }

    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function methodLabel(): string
    {
        return self::METHODS[$this->method] ?? $this->method;
    }
}
