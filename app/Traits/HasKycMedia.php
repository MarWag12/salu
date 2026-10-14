<?php

namespace App\Traits;

use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasKycMedia
{
    use InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('kyc_document')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'application/pdf']);

        $this->addMediaCollection('kyc_selfie')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Contain, 150, 150)
            ->nonQueued()
            ->performOnCollections('kyc_selfie');

        $this->addMediaConversion('preview')
            ->fit(Fit::Contain, 400, 400)
            ->nonQueued()
            ->performOnCollections('kyc_selfie', 'kyc_document');
    }

    public function getKycDocumentUrl(): ?string
    {
        return $this->getFirstMediaUrl('kyc_document', 'preview') ?: null;
    }

    public function getKycSelfieUrl(): ?string
    {
        return $this->getFirstMediaUrl('kyc_selfie', 'thumb') ?: null;
    }

    public function hasKycDocuments(): bool
    {
        return $this->hasMedia('kyc_document') && $this->hasMedia('kyc_selfie');
    }
}
