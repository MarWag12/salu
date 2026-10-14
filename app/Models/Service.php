<?php

namespace App\Models;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Traits\HasServiceMedia;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;

class Service extends Model implements HasMedia
{
    use HasFactory, HasServiceMedia;

    protected $fillable = [
        'service_provider_id',
        'category_id',
        'name',
        'description',
        'price_type',
        'price_min',
        'price_max',
        'location',
        'delivery_time',
        'supports_urgent',
        'urgent_fee_type',
        'urgent_fee_value',
        'urgent_delivery_time',
        'tags',
        'status',
        'view_count',
        'click_count',
        'conversion_count',
        'highlight_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'price_type' => PriceType::class,
            'status' => ServiceStatus::class,
            'price_min' => 'decimal:2',
            'price_max' => 'decimal:2',
            'urgent_fee_value' => 'decimal:2',
            'supports_urgent' => 'boolean',
            'tags' => 'array',
            'highlight_expires_at' => 'datetime',
        ];
    }

    public function serviceProvider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function packages(): HasMany
    {
        return $this->hasMany(ServicePackage::class);
    }

    /**
     * Get visible reviews for public display.
     */
    public function visibleReviews(): HasMany
    {
        return $this->hasMany(Review::class)->visible()->latest();
    }

    /**
     * Get average rating.
     */
    public function getAverageRatingAttribute(): float
    {
        return round($this->reviews()->visible()->avg('rating') ?? 0, 1);
    }

    /**
     * Get reviews count.
     */
    public function getReviewsCountAttribute(): int
    {
        return $this->reviews()->visible()->count();
    }

    public function scopePublished($query)
    {
        return $query->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED]);
    }

    public function scopeFeatured($query)
    {
        return $query->where('status', ServiceStatus::FEATURED)
            ->where('highlight_expires_at', '>', now());
    }

    public function scopePending($query)
    {
        return $query->where('status', ServiceStatus::PENDING);
    }

    public function scopeOrderByFeatured($query)
    {
        return $query->orderByRaw("CASE WHEN status = 'featured' AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END")
            ->orderByDesc('created_at');
    }

    public function isPending(): bool
    {
        return $this->status === ServiceStatus::PENDING;
    }

    public function isPublished(): bool
    {
        return $this->status === ServiceStatus::PUBLISHED;
    }

    public function isFeatured(): bool
    {
        return $this->status === ServiceStatus::FEATURED &&
               $this->highlight_expires_at &&
               $this->highlight_expires_at->isFuture();
    }

    public function isSuspended(): bool
    {
        return $this->status === ServiceStatus::SUSPENDED;
    }

    public function isPubliclyVisible(): bool
    {
        return $this->status->isPubliclyVisible();
    }

    /**
     * Get the price attribute (alias for price_min for backward compatibility).
     */
    public function getPriceAttribute(): ?float
    {
        return $this->price_min;
    }

    public function getFormattedPriceAttribute(): string
    {
        if ($this->price_type === PriceType::VARIABLE && $this->price_max) {
            return number_format($this->price_min, 2) . ' - ' . number_format($this->price_max, 2);
        }

        $suffix = $this->price_type === PriceType::HOURLY ? '/hora' : '';
        return number_format($this->price_min, 2) . $suffix;
    }

    public function incrementViews(): void
    {
        $this->increment('view_count');
    }

    public function incrementClicks(): void
    {
        $this->increment('click_count');
    }

    public function incrementConversions(): void
    {
        $this->increment('conversion_count');
    }

    /**
     * Get the cover URL for the service.
     */
    public function getCoverUrlAttribute(): ?string
    {
        return $this->getFirstMediaUrl('cover', 'thumb') ?: ($this->getFirstMediaUrl('cover') ?: null);
    }

    /**
     * Get the slug (using id as fallback).
     */
    public function getSlugAttribute(): string
    {
        return (string) $this->id;
    }

    /**
     * Get a short description (first 100 chars).
     */
    public function getShortDescriptionAttribute(): string
    {
        return \Str::limit($this->description ?? '', 100);
    }

    /**
     * Check if service is featured (accessor for views).
     */
    public function getIsFeaturedAttribute(): bool
    {
        return $this->isFeatured();
    }

    /**
     * Check if service is published (accessor for views).
     */
    public function getIsPublishedAttribute(): bool
    {
        return $this->isPublished() || $this->isFeatured();
    }

    /**
     * Get formatted price badge text.
     */
    public function getFormattedPriceBadgeAttribute(): string
    {
        $priceMin = number_format($this->price_min, 2, ',', '.');

        return match ($this->price_type) {
            PriceType::FIXED => "{$priceMin} Kz fixo",
            PriceType::HOURLY => "{$priceMin} Kz/hora",
            PriceType::VARIABLE => $this->price_max
                ? number_format($this->price_min, 2, ',', '.') . '-' . number_format($this->price_max, 2, ',', '.') . ' Kz'
                : "{$priceMin}+ Kz",
        };
    }

    /**
     * Get price badge color for UI.
     */
    public function getPriceBadgeColorAttribute(): string
    {
        return match ($this->price_type) {
            PriceType::FIXED => 'blue',
            PriceType::HOURLY => 'orange',
            PriceType::VARIABLE => 'green',
        };
    }

    /**
     * Get price type label in Portuguese.
     */
    public function getPriceTypeLabelAttribute(): string
    {
        return match ($this->price_type) {
            PriceType::FIXED => 'Preço Fixo',
            PriceType::HOURLY => 'Por Hora',
            PriceType::VARIABLE => 'Preço Variável',
        };
    }
}
