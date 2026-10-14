<?php

namespace Database\Factories;

use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Models\HighlightPlan;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $plan = HighlightPlan::factory()->create();

        return [
            'service_id' => Service::factory(),
            'service_provider_id' => ServiceProvider::factory(),
            'highlight_plan_id' => $plan->id,
            'gateway' => PaymentGateway::SIMULATION,
            'external_id' => 'sim_' . Str::random(24),
            'amount' => $plan->price,
            'currency' => $plan->currency,
            'status' => PaymentStatus::PENDING,
            'gateway_response' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::COMPLETED,
            'gateway_response' => ['status' => 'completed'],
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => PaymentStatus::FAILED,
            'gateway_response' => ['error' => 'Payment declined'],
        ]);
    }

    public function stripe(): static
    {
        return $this->state(fn (array $attributes) => [
            'gateway' => PaymentGateway::STRIPE,
            'external_id' => 'cs_' . Str::random(24),
        ]);
    }
}
