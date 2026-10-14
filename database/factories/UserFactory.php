<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'type' => User::TYPE_CLIENT,
            'phone' => fake()->optional()->phoneNumber(),
            'avatar' => null,
            'bio' => fake()->optional()->sentence(),
            'address' => fake()->optional()->streetAddress(),
            'city' => fake()->optional()->city(),
            'state' => fake()->optional()->randomElement(['Luanda','Benguela','Huíla','Huambo','Cabinda','Malanje']),
            'postal_code' => fake()->optional()->postcode(),
            'country' => 'Angola',
            'is_active' => true,
            'last_login_at' => null,
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Create an admin user.
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => User::TYPE_ADMIN,
        ]);
    }

    /**
     * Create a provider user.
     */
    public function provider(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => User::TYPE_PROVIDER,
        ]);
    }

    /**
     * Create a client user.
     */
    public function client(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => User::TYPE_CLIENT,
        ]);
    }

    /**
     * Create an inactive user.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
