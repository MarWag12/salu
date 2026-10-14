<?php

namespace App\Enums;

enum ServiceStatus: string
{
    case PENDING = 'pending';
    case PUBLISHED = 'published';
    case SUSPENDED = 'suspended';
    case FEATURED = 'featured';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pendente',
            self::PUBLISHED => 'Publicado',
            self::SUSPENDED => 'Suspenso',
            self::FEATURED => 'Destaque',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'warning',
            self::PUBLISHED => 'success',
            self::SUSPENDED => 'danger',
            self::FEATURED => 'primary',
        };
    }

    public function isPubliclyVisible(): bool
    {
        return in_array($this, [self::PUBLISHED, self::FEATURED]);
    }
}
