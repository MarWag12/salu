<?php

namespace Database\Factories;

use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ServiceProvider>
 */
class ServiceProviderFactory extends Factory
{
    protected $model = ServiceProvider::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->state(['type' => 'provider']),
            'company_name' => fake()->company(),
            'trading_name' => fake()->optional(0.7)->company(),
            'document_type' => fake()->randomElement([
                ServiceProvider::DOCUMENT_BI,
                ServiceProvider::DOCUMENT_NIF,
                ServiceProvider::DOCUMENT_PASSAPORTE,
            ]),
            'document_number' => fake()->numerify('##########'),
            'description' => fake()->optional()->paragraph(),
            'working_hours' => [
                'monday' => '08:00-18:00',
                'tuesday' => '08:00-18:00',
                'wednesday' => '08:00-18:00',
                'thursday' => '08:00-18:00',
                'friday' => '08:00-18:00',
            ],
            'rating' => fake()->randomFloat(2, 0, 5),
            'total_reviews' => fake()->numberBetween(0, 100),
            'completed_services' => fake()->numberBetween(0, 200),
            'is_verified' => false,
            'is_featured' => false,
            'verified_at' => null,
        ];
    }

    /**
     * Indica que o prestador está verificado (KYC aprovado)
     */
    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }

    /**
     * Indica que o prestador está em destaque
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }

    /**
     * Com boa avaliação
     */
    public function topRated(): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => fake()->randomFloat(2, 4.5, 5),
            'total_reviews' => fake()->numberBetween(20, 100),
            'is_verified' => true,
            'verified_at' => now(),
        ]);
    }
}
