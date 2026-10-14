<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    public function definition(): array
    {
        return [
            'client_id' => User::factory()->state(['type' => User::TYPE_CLIENT]),
            'provider_id' => User::factory()->state(['type' => User::TYPE_PROVIDER]),
            'service_id' => null,
            'last_message_at' => now(),
        ];
    }

    public function withService(): static
    {
        return $this->state(fn (array $attributes) => [
            'service_id' => Service::factory(),
        ]);
    }
}
