<?php

namespace App\Enums;

enum PriceType: string
{
    case FIXED = 'fixed';
    case VARIABLE = 'variable';
    case HOURLY = 'hourly';

    public function label(): string
    {
        return match ($this) {
            self::FIXED => 'Preço Fixo',
            self::VARIABLE => 'Preço Variável',
            self::HOURLY => 'Por Hora',
        };
    }
}
