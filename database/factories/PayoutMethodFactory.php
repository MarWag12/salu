<?php

namespace Database\Factories;

use App\Models\PayoutMethod;
use App\Models\ServiceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class PayoutMethodFactory extends Factory
{
    protected $model = PayoutMethod::class;

    public function definition(): array
    {
        return [
            'provider_id' => ServiceProvider::factory(),
            'type' => PayoutMethod::TYPE_BANK_TRANSFER,
            'name' => 'Conta principal',
            'bank_name' => 'BAI',
            'account_number' => fake()->numerify('##########'),
            'account_holder' => fake()->name(),
            'iban' => 'AO06' . fake()->numerify('####################'),
            'is_default' => true,
            'is_verified' => false,
        ];
    }
}
