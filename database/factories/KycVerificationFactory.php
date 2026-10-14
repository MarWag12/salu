<?php

namespace Database\Factories;

use App\Enums\KycStatus;
use App\Models\KycVerification;
use App\Models\ServiceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\KycVerification>
 */
class KycVerificationFactory extends Factory
{
    protected $model = KycVerification::class;

    public function definition(): array
    {
        return [
            'service_provider_id' => ServiceProvider::factory(),
            'status' => KycStatus::PENDING,
            'rejection_reason' => null,
            'submitted_at' => now(),
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KycStatus::APPROVED,
            'reviewed_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KycStatus::REJECTED,
            'rejection_reason' => fake()->sentence(),
            'reviewed_at' => now(),
        ]);
    }

    public function resubmit(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => KycStatus::RESUBMIT,
            'rejection_reason' => fake()->sentence(),
            'reviewed_at' => now(),
        ]);
    }
}
