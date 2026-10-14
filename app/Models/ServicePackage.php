<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServicePackage extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'service_id',
        'package_type',
        'name',
        'description',
        'price',
        'delivery_time',
        'features',
        'revisions_included',
        'is_active',
        'display_order',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'revisions_included' => 'integer',
        'is_active' => 'boolean',
        'display_order' => 'integer',
    ];

    /**
     * Get the service that owns the package.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the orders for this package.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'service_package_id');
    }

    /**
     * Scope a query to only include active packages.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include packages of a given type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('package_type', $type);
    }

    /**
     * Scope a query to order packages by display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('display_order')->orderBy('id');
    }

    /**
     * Get formatted price with currency.
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price, 2, ',', '.') . ' AOA';
    }

    /**
     * Get package type label in Portuguese.
     */
    public function getTypeLabel(): string
    {
        return match($this->package_type) {
            'basic' => 'Básico',
            'professional' => 'Profissional',
            'premium' => 'Premium',
            default => ucfirst($this->package_type),
        };
    }
}
