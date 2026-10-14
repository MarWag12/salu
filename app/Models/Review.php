<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_id',
        'provider_id',
        'review_type', // 'service' or 'provider'
        'user_id',
        'order_id',
        'rating',
        'comment',
        'provider_response',
        'provider_responded_at',
        'is_verified',
        'is_visible',
        'is_anonymous',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'is_verified' => 'boolean',
            'is_visible' => 'boolean',
            'is_anonymous' => 'boolean',
            'provider_responded_at' => 'datetime',
        ];
    }

    /**
     * Get the reviewer name (respecting anonymity).
     */
    public function getReviewerNameAttribute(): string
    {
        if ($this->is_anonymous) {
            return 'Utilizador Anónimo';
        }

        return $this->user?->name ?? 'Utilizador';
    }

    /**
     * Get the reviewer avatar (respecting anonymity).
     */
    public function getReviewerAvatarAttribute(): ?string
    {
        if ($this->is_anonymous) {
            return null;
        }

        return $this->user?->avatar_url;
    }

    /**
     * Relationships
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ServiceProvider::class, 'provider_id');
    }

    /**
     * Scopes
     */
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeForService($query, $serviceId)
    {
        return $query->where('service_id', $serviceId)->where('review_type', 'service');
    }

    public function scopeForProvider($query, $providerId)
    {
        return $query->where('provider_id', $providerId)->where('review_type', 'provider');
    }

    public function scopeServiceReviews($query)
    {
        return $query->where('review_type', 'service');
    }

    public function scopeProviderReviews($query)
    {
        return $query->where('review_type', 'provider');
    }

    public function scopeByRating($query, $rating)
    {
        return $query->where('rating', $rating);
    }

    /**
     * Check if review has provider response.
     */
    public function hasResponse(): bool
    {
        return !empty($this->provider_response);
    }

    /**
     * Add provider response.
     */
    public function respond(string $response): bool
    {
        return $this->update([
            'provider_response' => $response,
            'provider_responded_at' => now(),
        ]);
    }

    /**
     * Get rating stars as array.
     */
    public function getRatingStarsAttribute(): array
    {
        return array_fill(0, $this->rating, true) + array_fill($this->rating, 5 - $this->rating, false);
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // After creating a review, update service and provider ratings
        static::created(function ($review) {
            $review->updateServiceRating();
            $review->updateProviderRating();
        });

        // After updating a review, update ratings
        static::updated(function ($review) {
            if ($review->isDirty('rating') || $review->isDirty('is_visible')) {
                $review->updateServiceRating();
                $review->updateProviderRating();
            }
        });

        // After deleting, update ratings
        static::deleted(function ($review) {
            $review->updateServiceRating();
            $review->updateProviderRating();
        });
    }

    /**
     * Update service average rating.
     */
    public function updateServiceRating(): void
    {
        $service = $this->service;
        if (!$service) return;

        $stats = self::where('service_id', $service->id)
            ->where('is_visible', true)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        // If service has rating fields
        if (method_exists($service, 'updateRating')) {
            $service->updateRating($stats->avg_rating ?? 0, $stats->total ?? 0);
        }
    }

    /**
     * Update provider average rating.
     */
    public function updateProviderRating(): void
    {
        $provider = $this->provider;

        // Fallback to service's provider if provider_id is not set
        if (!$provider && $this->service) {
            $provider = $this->service->serviceProvider;
        }

        if (!$provider) return;

        // Calculate average from all provider's reviews
        $stats = self::query()
            ->where('provider_id', $provider->id)
            ->where('is_visible', true)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        $provider->update([
            'rating' => round($stats->avg_rating ?? 0, 2),
            'total_reviews' => $stats->total ?? 0,
        ]);
    }
}
