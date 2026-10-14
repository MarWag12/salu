<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class RecommendationService
{
    /**
     * Score calculation weights
     */
    private const WEIGHTS = [
        'completion_rate' => 0.30,
        'rating' => 0.25,
        'response_time_score' => 0.20,
        'on_time_delivery' => 0.15,
        'acceptance_rate' => 0.10,
    ];

    /**
     * Get recommended providers for a service
     *
     * @param User|null $client
     * @param Service $service
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    public function getRecommendedProviders(?User $client, Service $service, int $limit = 5)
    {
        // Get all providers who offer services in the same category
        $providers = ServiceProvider::whereHas('services', function ($query) use ($service) {
            $query->where('category_id', $service->category_id)
                  ->where('status', 'published')
                  ->where('id', '!=', $service->id); // Exclude current service's provider
        })
        ->where('is_verified', true)
        ->with(['user', 'services' => function ($query) use ($service) {
            $query->where('category_id', $service->category_id)
                  ->where('status', 'published');
        }])
        ->get();

        // Calculate scores for each provider
        $scoredProviders = $providers->map(function ($provider) use ($client, $service) {
            $score = $this->calculateProviderScore($provider, $client, $service);
            return [
                'provider' => $provider,
                'score' => $score['total_score'],
                'factors' => $score['factors'],
            ];
        });

        // Sort by score and take top N
        $topProviders = $scoredProviders->sortByDesc('score')->take($limit);

        // Log recommendations (if user is logged in)
        if ($client) {
            foreach ($topProviders as $item) {
                $this->logRecommendation(
                    $client,
                    $service,
                    $item['provider'],
                    $item['score'],
                    $item['factors']
                );
            }
        }

        return $topProviders->pluck('provider');
    }

    /**
     * Calculate provider score for recommendations
     *
     * @param ServiceProvider $provider
     * @param User|null $client
     * @param Service $service
     * @return array
     */
    public function calculateProviderScore(ServiceProvider $provider, ?User $client, Service $service): array
    {
        $factors = [];

        // 1. Completion Rate (30%)
        $orders = Order::where('provider_id', $provider->id);
        $totalOrders = $orders->count();
        $completedOrders = (clone $orders)->where('status', 'completed')->count();

        $completionRate = $totalOrders > 0 ? ($completedOrders / $totalOrders) * 100 : 0;
        $factors['completion_rate'] = $completionRate;

        // 2. Rating (25%)
        $ratingScore = $provider->rating ? ($provider->rating / 5) * 100 : 0;
        $factors['rating_score'] = $ratingScore;

        // 3. Response Time Score (20%)
        $responseScore = $this->calculateResponseScore($provider->average_response_time_minutes);
        $factors['response_time_score'] = $responseScore;

        // 4. On-Time Delivery (15%)
        $factors['on_time_delivery'] = $provider->on_time_delivery_rate;

        // 5. Acceptance Rate (10%)
        $factors['acceptance_rate'] = $provider->acceptance_rate;

        // Calculate base score
        $baseScore = (
            $completionRate * self::WEIGHTS['completion_rate'] +
            $ratingScore * self::WEIGHTS['rating'] +
            $responseScore * self::WEIGHTS['response_time_score'] +
            $provider->on_time_delivery_rate * self::WEIGHTS['on_time_delivery'] +
            $provider->acceptance_rate * self::WEIGHTS['acceptance_rate']
        );

        // Bonus factors
        $bonusScore = 0;
        $bonuses = [];

        // Bonus: Provider already served this client (+10 points)
        if ($client && $this->hasServedClient($provider, $client)) {
            $bonusScore += 10;
            $bonuses[] = 'previous_client';
        }

        // Bonus: Same location (+5 points)
        if ($client && $this->isSameLocation($provider, $client)) {
            $bonusScore += 5;
            $bonuses[] = 'same_location';
        }

        // Bonus: Platinum Salu Score (+5 points)
        if ($provider->salu_badge === 'platinum') {
            $bonusScore += 5;
            $bonuses[] = 'platinum_badge';
        }

        // Bonus: High score (+3 points if score >= 75)
        if ($provider->salu_score >= 75) {
            $bonusScore += 3;
            $bonuses[] = 'high_score';
        }

        $totalScore = round($baseScore + $bonusScore, 2);

        return [
            'total_score' => $totalScore,
            'factors' => array_merge($factors, [
                'bonus_score' => $bonusScore,
                'bonuses' => $bonuses,
            ]),
        ];
    }

    /**
     * Calculate response time score (0-100)
     *
     * @param int $averageMinutes
     * @return float
     */
    private function calculateResponseScore(int $averageMinutes): float
    {
        if ($averageMinutes <= 5) {
            return 100;
        }

        if ($averageMinutes >= 120) {
            return 0;
        }

        // Linear decrease from 100 to 0 between 5 and 120 minutes
        return 100 - (($averageMinutes - 5) / 115 * 100);
    }

    /**
     * Check if provider has served this client before
     *
     * @param ServiceProvider $provider
     * @param User $client
     * @return bool
     */
    private function hasServedClient(ServiceProvider $provider, User $client): bool
    {
        return Order::where('provider_id', $provider->id)
            ->where('client_id', $client->id)
            ->where('status', 'completed')
            ->exists();
    }

    /**
     * Check if provider is in same location as client
     *
     * @param ServiceProvider $provider
     * @param User $client
     * @return bool
     */
    private function isSameLocation(ServiceProvider $provider, User $client): bool
    {
        if (!$provider->user->location || !$client->location) {
            return false;
        }

        // Simple string comparison (can be improved with geocoding)
        return strtolower($provider->user->location) === strtolower($client->location);
    }

    /**
     * Log recommendation for analytics
     *
     * @param User $client
     * @param Service $service
     * @param ServiceProvider $provider
     * @param float $score
     * @param array $factors
     * @return void
     */
    public function logRecommendation(User $client, Service $service, ServiceProvider $provider, float $score, array $factors): void
    {
        DB::table('recommendation_logs')->insert([
            'user_id' => $client->id,
            'service_id' => $service->id,
            'provider_id' => $provider->id,
            'recommendation_score' => $score,
            'factors' => json_encode($factors),
            'was_clicked' => false,
            'was_hired' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Mark recommendation as clicked
     *
     * @param int $userId
     * @param int $providerId
     * @return void
     */
    public function markAsClicked(int $userId, int $providerId): void
    {
        DB::table('recommendation_logs')
            ->where('user_id', $userId)
            ->where('provider_id', $providerId)
            ->where('created_at', '>=', now()->subHours(24))
            ->update(['was_clicked' => true]);
    }

    /**
     * Mark recommendation as hired
     *
     * @param int $userId
     * @param int $providerId
     * @return void
     */
    public function markAsHired(int $userId, int $providerId): void
    {
        DB::table('recommendation_logs')
            ->where('user_id', $userId)
            ->where('provider_id', $providerId)
            ->where('created_at', '>=', now()->subDays(7))
            ->update(['was_hired' => true]);
    }

    /**
     * Get recommendation analytics
     *
     * @return array
     */
    public function getAnalytics(): array
    {
        $total = DB::table('recommendation_logs')->count();
        $clicked = DB::table('recommendation_logs')->where('was_clicked', true)->count();
        $hired = DB::table('recommendation_logs')->where('was_hired', true)->count();

        return [
            'total_recommendations' => $total,
            'click_through_rate' => $total > 0 ? round(($clicked / $total) * 100, 2) : 0,
            'conversion_rate' => $total > 0 ? round(($hired / $total) * 100, 2) : 0,
        ];
    }
}
