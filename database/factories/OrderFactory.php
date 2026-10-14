<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $price = fake()->randomFloat(2, 1000, 50000);

        return [
            'service_id' => Service::factory(),
            'client_id' => User::factory()->client(),
            'provider_id' => ServiceProvider::factory(),
            'status' => OrderStatus::PENDING,
            'agreed_price' => $price,
            'service_fee' => round($price * 0.10, 2),
            'requirements' => fake()->optional()->paragraph(),
        ];
    }

    /**
     * Set order status to pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::PENDING,
        ]);
    }

    /**
     * Set order status to accepted.
     */
    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::ACCEPTED,
            'accepted_at' => now(),
        ]);
    }

    /**
     * Set order status to in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::IN_PROGRESS,
            'accepted_at' => now()->subHours(2),
            'started_at' => now(),
        ]);
    }

    /**
     * Set order status to delivered.
     */
    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::DELIVERED,
            'accepted_at' => now()->subDays(2),
            'started_at' => now()->subDays(1),
            'delivered_at' => now(),
            'delivery_notes' => fake()->optional()->sentence(),
        ]);
    }

    /**
     * Set order status to completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::COMPLETED,
            'accepted_at' => now()->subDays(3),
            'started_at' => now()->subDays(2),
            'delivered_at' => now()->subDay(),
            'completed_at' => now(),
        ]);
    }

    /**
     * Set order status to cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => fake()->sentence(),
        ]);
    }

    /**
     * Set order status to disputed.
     */
    public function disputed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => OrderStatus::DISPUTED,
            'accepted_at' => now()->subDays(2),
            'started_at' => now()->subDay(),
            'dispute_reason' => fake()->paragraph(),
        ]);
    }

    /**
     * Create order with specific client.
     */
    public function forClient(User $client): static
    {
        return $this->state(fn (array $attributes) => [
            'client_id' => $client->id,
        ]);
    }

    /**
     * Create order with specific service and provider.
     */
    public function forService(Service $service): static
    {
        $price = $service->price_min ?? $service->price;
        return $this->state(fn (array $attributes) => [
            'service_id' => $service->id,
            'provider_id' => $service->service_provider_id,
            'agreed_price' => $price,
            'service_fee' => round($price * 0.10, 2),
        ]);
    }
}
