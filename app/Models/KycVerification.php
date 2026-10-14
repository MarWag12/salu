<?php

namespace App\Models;

use App\Enums\KycStatus;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KycVerification extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'service_provider_id',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'submitted_at',
        'ai_face_match_score',
        'ai_liveness_score',
        'ai_verification_status',
        'ai_verification_response',
        'ai_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => KycStatus::class,
            'reviewed_at' => 'datetime',
            'submitted_at' => 'datetime',
            'ai_verified_at' => 'datetime',
            'ai_verification_response' => 'array',
        ];
    }

    public function serviceProvider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(KycDocument::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(KycStatusHistory::class)->orderByDesc('created_at');
    }

    public function scopePending($query)
    {
        return $query->where('status', KycStatus::PENDING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', KycStatus::APPROVED);
    }

    public function isPending(): bool
    {
        return $this->status === KycStatus::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === KycStatus::APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === KycStatus::REJECTED;
    }

    public function needsResubmission(): bool
    {
        return $this->status === KycStatus::RESUBMIT;
    }
}
