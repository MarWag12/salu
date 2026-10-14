<?php

namespace Database\Factories;

use App\Models\HighlightPlan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\HighlightPlan>
 */
class HighlightPlanFactory extends Factory
{
    protected $model = HighlightPlan::class;

    public function definition(): array
    {
        $durationDays = fake()->randomElement([7, 14, 30]);

        return [
            'name' => "Plano {$durationDays} dias",
            'duration_days' => $durationDays,
            'price' => $durationDays * 500,
            'currency' => 'AOA',
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
