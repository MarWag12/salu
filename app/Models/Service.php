<?php

namespace App\Models;

use App\Models\Concerns\Audited;
use App\Models\Concerns\HasUniqueSlug;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Service extends Model implements HasMedia
{
    use Audited, HasUniqueSlug, InteractsWithMedia;

    protected static function auditLabel(): string
    {
        return 'servico';
    }

    protected $fillable = ['category_id', 'name', 'slug', 'description', 'base_price', 'duration_minutes', 'featured', 'active'];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'featured' => 'boolean',
            'active' => 'boolean',
        ];
    }

    // ---- Spatie Media Library: imagem do serviço ----
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('image')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('card')
            ->performOnCollections('image')
            ->width(640)->height(400)
            ->nonQueued();
    }

    /** URL da miniatura (ou null → a interface mostra o ícone da categoria). */
    public function imageUrl(): ?string
    {
        $url = $this->getFirstMediaUrl('image', 'card') ?: $this->getFirstMediaUrl('image');

        return $url ?: null;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function scopeActive($q)
    {
        return $q->where('active', true);
    }

    public function durationLabel(): string
    {
        $m = $this->duration_minutes;
        if ($m < 60) {
            return $m.' min';
        }
        $h = intdiv($m, 60);
        $r = $m % 60;

        return $r ? "{$h}h {$r}min" : "{$h}h";
    }
}
