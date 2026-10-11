<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Technician extends Model implements HasMedia
{
    use InteractsWithMedia;

    public const KYC_PENDENTE = 'pendente';
    public const KYC_APROVADO = 'aprovado';
    public const KYC_REJEITADO = 'rejeitado';

    public const KYC_STATUSES = [
        self::KYC_PENDENTE => 'Pendente',
        self::KYC_APROVADO => 'Aprovado',
        self::KYC_REJEITADO => 'Rejeitado',
    ];

    protected $fillable = [
        'user_id', 'bio', 'municipality', 'experience_years', 'kyc_status',
        'kyc_notes', 'available', 'rating_avg', 'reviews_count',
    ];

    protected function casts(): array
    {
        return ['available' => 'boolean', 'rating_avg' => 'float'];
    }

    // ---- Spatie Media Library: documento KYC (disco privado, servido por rota autenticada) ----
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('kyc_document')
            ->singleFile()
            ->useDisk('local')
            ->acceptsMimeTypes(['application/pdf', 'image/jpeg', 'image/png']);
    }

    public function hasKycDocument(): bool
    {
        return $this->hasMedia('kyc_document');
    }

    /** URL protegida (apenas o próprio técnico e administradores). */
    public function kycDocumentUrl(): ?string
    {
        return $this->hasKycDocument() ? route('kyc.document', $this) : null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopeApproved($q)
    {
        return $q->where('kyc_status', self::KYC_APROVADO);
    }

    public function isApproved(): bool
    {
        return $this->kyc_status === self::KYC_APROVADO;
    }

    public function recalcRating(): void
    {
        $this->update([
            'rating_avg' => round((float) $this->reviews()->avg('rating'), 2),
            'reviews_count' => $this->reviews()->count(),
        ]);
    }
}
