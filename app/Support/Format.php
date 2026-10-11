<?php

namespace App\Support;

final class Format
{
    /** 1500 → "AOA 1 500,00" */
    public static function aoa(float|int|string|null $value): string
    {
        return 'AOA '.number_format((float) $value, 2, ',', ' ');
    }
}
