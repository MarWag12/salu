<?php

namespace App\Enums;

enum PaymentGateway: string
{
    case SIMULATION = 'simulation';
    case STRIPE = 'stripe';
    case PAYPAL = 'paypal';
    case MPESA = 'mpesa';

    public function label(): string
    {
        return match ($this) {
            self::SIMULATION => 'Simulação',
            self::STRIPE => 'Stripe',
            self::PAYPAL => 'PayPal',
            self::MPESA => 'M-Pesa',
        };
    }
}
