<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Review>
 */
class ReviewFactory extends Factory
{
    protected $model = Review::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_id' => Service::factory(),
            'user_id' => User::factory()->client(),
            'order_id' => null,
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional(0.8)->paragraph(),
            'provider_response' => null,
            'provider_responded_at' => null,
            'is_verified' => false,
            'is_visible' => true,
        ];
    }

    /**
     * Set rating to 5 stars.
     */
    public function excellent(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 5,
            'comment' => 'Excelente serviço! Recomendo a todos.',
        ]);
    }

    /**
     * Set rating to 1 star.
     */
    public function poor(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => 1,
            'comment' => 'Serviço muito abaixo das expectativas.',
        ]);
    }

    /**
     * Mark as verified purchase.
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
        ]);
    }

    /**
     * Mark as hidden.
     */
    public function hidden(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_visible' => false,
        ]);
    }

    /**
     * Add provider response.
     */
    public function withResponse(): static
    {
        return $this->state(fn (array $attributes) => [
            'provider_response' => fake()->paragraph(),
            'provider_responded_at' => now(),
        ]);
    }

    /**
     * Create review for specific service.
     */
    public function forService(Service $service): static
    {
        return $this->state(fn (array $attributes) => [
            'service_id' => $service->id,
        ]);
    }

    /**
     * Create review from specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Create review linked to an order.
     */
    public function forOrder(Order $order): static
    {
        return $this->state(fn (array $attributes) => [
            'service_id' => $order->service_id,
            'user_id' => $order->client_id,
            'order_id' => $order->id,
            'is_verified' => true,
        ]);
    }

    /**
     * Set specific rating.
     */
    public function rating(int $rating): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => min(5, max(1, $rating)),
        ]);
    }
}
