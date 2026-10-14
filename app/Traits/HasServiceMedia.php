<?php

namespace App\Traits;

use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasServiceMedia
{
    use InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('gallery')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->fit(Fit::Crop, 300, 200)
            ->nonQueued()
            ->performOnCollections('cover', 'gallery');

        $this->addMediaConversion('medium')
            ->fit(Fit::Contain, 600, 400)
            ->nonQueued()
            ->performOnCollections('cover', 'gallery');

        $this->addMediaConversion('large')
            ->fit(Fit::Contain, 1200, 800)
            ->nonQueued()
            ->performOnCollections('cover', 'gallery');
    }

    public function getCoverUrl(string $conversion = 'medium'): ?string
    {
        $url = $this->getFirstMediaUrl('cover', $conversion);
        return $url ?: $this->getFirstMediaUrl('cover');
    }

    public function getGalleryUrls(string $conversion = 'medium'): array
    {
        return $this->getMedia('gallery')
            ->map(fn ($media) => $media->getUrl($conversion) ?: $media->getUrl())
            ->toArray();
    }

    public function hasCover(): bool
    {
        return $this->hasMedia('cover');
    }

    public function getGalleryCount(): int
    {
        return $this->getMedia('gallery')->count();
    }
}
