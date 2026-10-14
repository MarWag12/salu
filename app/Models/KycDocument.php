<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Image\Enums\Fit;

class KycDocument extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    const TYPE_IDENTITY = 'identity_document';
    const TYPE_SELFIE = 'selfie';

    protected $fillable = [
        'kyc_verification_id',
        'type',
        'original_filename',
    ];

    public function kycVerification(): BelongsTo
    {
        return $this->belongsTo(KycVerification::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('document')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'application/pdf']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Contain, 150, 150)
            ->nonQueued();

        $this->addMediaConversion('preview')
            ->fit(Fit::Contain, 600, 600)
            ->nonQueued();
    }

    public function getDocumentUrl(): ?string
    {
        return $this->getFirstMediaUrl('document') ?: null;
    }

    public function getPreviewUrl(): ?string
    {
        return $this->getFirstMediaUrl('document', 'preview') ?: null;
    }

    public function getThumbUrl(): ?string
    {
        return $this->getFirstMediaUrl('document', 'thumb') ?: null;
    }

    public function isIdentityDocument(): bool
    {
        return $this->type === self::TYPE_IDENTITY;
    }

    public function isSelfie(): bool
    {
        return $this->type === self::TYPE_SELFIE;
    }
}
