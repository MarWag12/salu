<?php

namespace App\Models\Concerns;

use Illuminate\Support\Str;

/** Gera/actualiza o slug a partir do nome, garantindo unicidade (usado por Category e Service). */
trait HasUniqueSlug
{
    public static function bootHasUniqueSlug(): void
    {
        static::saving(function ($model) {
            if (empty($model->slug) || ($model->isDirty('name') && ! $model->isDirty('slug'))) {
                $model->slug = static::uniqueSlugFor($model->name, $model->getKey());
            }
        });
    }

    protected static function uniqueSlugFor(string $name, $ignoreId = null): string
    {
        $base = Str::slug($name) ?: 'item';
        $slug = $base;
        $i = 2;

        while (static::query()->where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
