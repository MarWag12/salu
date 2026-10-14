<?php

namespace App\Models;

use App\Traits\HasKycMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\MediaLibrary\HasMedia;

class ServiceProvider extends Model implements HasMedia
{
    use HasFactory, HasKycMedia;

    // Tipos de documento angolanos
    const DOCUMENT_BI = 'bi';           // Bilhete de Identidade
    const DOCUMENT_NIF = 'nif';         // Número de Identificação Fiscal
    const DOCUMENT_PASSAPORTE = 'passaporte';

    // Aliases para compatibilidade com código antigo
    const DOCUMENT_CPF = 'bi';
    const DOCUMENT_CNPJ = 'nif';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'company_name',
        'trading_name',
        'document_type',
        'document_number',
        'description',
        'working_hours',
        'rating',
        'total_reviews',
        'completed_services',
        'is_verified',
        'is_featured',
        'verified_at',
        // Salu Score fields
        'salu_score',
        'salu_badge',
        'total_cancellations',
        'total_complaints',
        'punctuality_score',
        'score_updated_at',
        'average_response_time_minutes',
        'acceptance_rate',
        'on_time_delivery_rate',
        'last_active_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'working_hours' => 'array',
            'rating' => 'decimal:2',
            'is_verified' => 'boolean',
            'is_featured' => 'boolean',
            'verified_at' => 'datetime',
            // Salu Score casts
            'punctuality_score' => 'decimal:2',
            'acceptance_rate' => 'decimal:2',
            'on_time_delivery_rate' => 'decimal:2',
            'score_updated_at' => 'datetime',
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the service provider profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the display name (company name or user name)
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->trading_name ?? $this->company_name ?? $this->user->name;
    }

    /**
     * Get formatted document number
     */
    public function getFormattedDocumentAttribute(): string
    {
        return $this->document_number ?? '';
    }

    /**
     * Get document type label
     */
    public function getDocumentTypeLabelAttribute(): string
    {
        return match ($this->document_type) {
            self::DOCUMENT_BI, 'bi' => 'Bilhete de Identidade',
            self::DOCUMENT_NIF, 'nif' => 'NIF',
            self::DOCUMENT_PASSAPORTE, 'passaporte' => 'Passaporte',
            default => $this->document_type ?? 'N/A',
        };
    }

    /**
     * Scope for verified providers
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope for featured providers
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope for top rated providers
     */
    public function scopeTopRated($query, $minRating = 4.0)
    {
        return $query->where('rating', '>=', $minRating)
                     ->orderByDesc('rating');
    }

    /**
     * Scope for providers with minimum Salu Score
     */
    public function scopeTopScored($query, $minScore = 75)
    {
        return $query->where('salu_score', '>=', $minScore)
                     ->orderByDesc('salu_score');
    }

    /**
     * Scope for providers by badge level
     */
    public function scopeByBadge($query, string $badge)
    {
        return $query->where('salu_badge', $badge);
    }

    /**
     * Get the services for this provider.
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Get the payments for this provider.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the KYC verifications for this provider.
     */
    public function kycVerifications(): HasMany
    {
        return $this->hasMany(KycVerification::class);
    }

    /**
     * Get all orders for this provider.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'provider_id');
    }

    /**
     * Get active orders.
     */
    public function activeOrders(): HasMany
    {
        return $this->orders()->active();
    }

    /**
     * Get completed orders.
     */
    public function completedOrders(): HasMany
    {
        return $this->orders()->completed();
    }

    /**
     * Get the latest KYC verification.
     */
    public function latestKycVerification(): HasOne
    {
        return $this->hasOne(KycVerification::class)->latestOfMany();
    }

    /**
     * Check if provider has approved KYC.
     */
    public function hasApprovedKyc(): bool
    {
        return $this->is_verified ||
               $this->latestKycVerification?->isApproved() === true;
    }

    /**
     * Get published services count.
     */
    public function getPublishedServicesCountAttribute(): int
    {
        return $this->services()->published()->count();
    }

    /**
     * Get the disputes for this provider.
     */
    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class, 'provider_id');
    }

    /**
     * Get the payouts for this provider.
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'provider_id');
    }

    /**
     * Get the payout methods for this provider.
     */
    public function payoutMethods(): HasMany
    {
        return $this->hasMany(PayoutMethod::class, 'provider_id');
    }

    /**
     * Get the default payout method.
     */
    public function defaultPayoutMethod(): HasOne
    {
        return $this->hasOne(PayoutMethod::class, 'provider_id')->where('is_default', true);
    }

    /**
     * Get available balance (completed orders not yet paid out).
     * Calculates: (agreed_price - service_fee) for completed orders, minus payouts already made or pending.
     */
    public function getAvailableBalanceAttribute(): float
    {
        // Net earnings = agreed_price - service_fee (platform commission)
        $totalEarned = $this->orders()
            ->completed()
            ->selectRaw('COALESCE(SUM(agreed_price - COALESCE(service_fee, 0)), 0) as net_total')
            ->value('net_total') ?? 0;

        // Subtract completed payouts
        $totalPaidOut = $this->payouts()
            ->where('status', Payout::STATUS_COMPLETED)
            ->sum('amount');

        // Subtract pending/processing payouts (reserved)
        $pendingPayouts = $this->pending_payouts;

        return max(0, (float) $totalEarned - $totalPaidOut - $pendingPayouts);
    }

    /**
     * Get pending payouts amount.
     */
    public function getPendingPayoutsAttribute(): float
    {
        return $this->payouts()
            ->whereIn('status', [Payout::STATUS_PENDING, Payout::STATUS_PROCESSING])
            ->sum('amount');
    }

    /**
     * Get total earnings (all time).
     */
    public function getTotalEarningsAttribute(): float
    {
        return $this->orders()
            ->completed()
            ->selectRaw('COALESCE(SUM(agreed_price - COALESCE(service_fee, 0)), 0) as net_total')
            ->value('net_total') ?? 0;
    }

    /**
     * Get total paid out amount.
     */
    public function getTotalPaidOutAttribute(): float
    {
        return $this->payouts()
            ->where('status', Payout::STATUS_COMPLETED)
            ->sum('net_amount');
    }

    /**
     * Get Salu Score badge color for UI
     */
    public function getSaluScoreBadgeColorAttribute(): string
    {
        return match ($this->salu_badge) {
            'platinum' => 'purple',
            'gold' => 'yellow',
            'silver' => 'gray',
            'bronze' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Get Salu Score badge label
     */
    public function getSaluScoreBadgeLabelAttribute(): string
    {
        return match ($this->salu_badge) {
            'platinum' => 'Platina',
            'gold' => 'Ouro',
            'silver' => 'Prata',
            'bronze' => 'Bronze',
            default => 'Sem Badge',
        };
    }

    /**
     * Check if provider has a high Salu Score
     */
    public function hasHighScore(): bool
    {
        return $this->salu_score >= 75;
    }

    /**
     * Check if provider has platinum badge
     */
    public function isPlatinum(): bool
    {
        return $this->salu_badge === 'platinum';
    }
}
