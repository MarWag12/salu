<?php

namespace Database\Factories;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    public function definition(): array
    {
        $priceType = fake()->randomElement(PriceType::cases());
        $priceMin = fake()->randomFloat(2, 50, 500);

        return [
            'service_provider_id' => ServiceProvider::factory(),
            'category_id' => Category::factory(),
            'name' => fake()->sentence(3),
            'description' => fake()->paragraphs(3, true),
            'price_type' => $priceType,
            'price_min' => $priceMin,
            'price_max' => $priceType === PriceType::VARIABLE ? $priceMin + fake()->randomFloat(2, 100, 500) : null,
            'location' => fake()->city(),
            'delivery_time' => fake()->optional()->numberBetween(1, 30),
            'tags' => fake()->words(5),
            'status' => ServiceStatus::PENDING,
            'view_count' => 0,
            'click_count' => 0,
            'conversion_count' => 0,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ServiceStatus::PUBLISHED,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ServiceStatus::FEATURED,
            'highlight_expires_at' => now()->addDays(7),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ServiceStatus::SUSPENDED,
        ]);
    }
}
