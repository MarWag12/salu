<?php

namespace App\Services;

use App\Models\ServiceProvider;
use App\Models\Order;
use App\Enums\OrderStatus;
use Illuminate\Support\Facades\DB;

class SaluScoreService
{
    /**
     * Badge thresholds
     */
    private const BADGE_THRESHOLDS = [
        'bronze' => 0,
        'silver' => 60,
        'gold' => 75,
        'platinum' => 90,
    ];

    /**
     * Score calculation weights
     */
    private const WEIGHTS = [
        'completion_rate' => 35,
        'rating' => 20,
        'cancellation_penalty' => 15,
        'complaint_penalty' => 10,
        'punctuality' => 15,
        'response_quality' => 5,
    ];

    /**
     * Calculate Salu Score for a provider
     *
     * @param ServiceProvider $provider
     * @return int Score between 0-100
     */
    public function calculateSaluScore(ServiceProvider $provider): int
    {
        $breakdown = $this->getScoreBreakdown($provider);

        $score = (
            $breakdown['completion_rate'] * self::WEIGHTS['completion_rate'] / 100 +
            $breakdown['rating_score'] * self::WEIGHTS['rating'] / 100 +
            $breakdown['cancellation_score'] * self::WEIGHTS['cancellation_penalty'] / 100 +
            $breakdown['complaint_score'] * self::WEIGHTS['complaint_penalty'] / 100 +
            $breakdown['punctuality_score'] * self::WEIGHTS['punctuality'] / 100 +
            $breakdown['response_quality'] * self::WEIGHTS['response_quality'] / 100
        );

        return (int) round(max(0, min(100, $score)));
    }

    /**
     * Update Salu Score for a provider
     *
     * @param ServiceProvider $provider
     * @return void
     */
    public function updateSaluScore(ServiceProvider $provider): void
    {
        $score = $this->calculateSaluScore($provider);
        $badge = $this->getBadgeLevel($score);

        $provider->update([
            'salu_score' => $score,
            'salu_badge' => $badge,
            'score_updated_at' => now(),
        ]);
    }

    /**
     * Get badge level based on score
     *
     * @param int $score
     * @return string|null
     */
    public function getBadgeLevel(int $score): ?string
    {
        if ($score >= self::BADGE_THRESHOLDS['platinum']) {
            return 'platinum';
        } elseif ($score >= self::BADGE_THRESHOLDS['gold']) {
            return 'gold';
        } elseif ($score >= self::BADGE_THRESHOLDS['silver']) {
            return 'silver';
        }

        return 'bronze';
    }

    /**
     * Get detailed score breakdown
     *
     * @param ServiceProvider $provider
     * @return array
     */
    public function getScoreBreakdown(ServiceProvider $provider): array
    {
        $orders = Order::where('provider_id', $provider->id);

        $totalOrders = $orders->count();
        $completedOrders = (clone $orders)->where('status', OrderStatus::COMPLETED)->count();
        $cancelledOrders = (clone $orders)->where('status', OrderStatus::CANCELLED)->count();
        $disputedOrders = (clone $orders)->whereNotNull('dispute_reason')->count();

        // Completion Rate (0-100)
        $completionRate = $totalOrders > 0
            ? ($completedOrders / $totalOrders) * 100
            : 0;

        // Rating Score (convert 0-5 to 0-100)
        $ratingScore = ($provider->rating / 5) * 100;

        // Cancellation Score (100 - cancellation_rate)
        $cancellationRate = $totalOrders > 0
            ? ($cancelledOrders / $totalOrders) * 100
            : 0;
        $cancellationScore = 100 - $cancellationRate;

        // Complaint Score (100 - complaint_rate)
        $complaintRate = $totalOrders > 0
            ? ($disputedOrders / $totalOrders) * 100
            : 0;
        $complaintScore = 100 - $complaintRate;

        // Punctuality Score (from provider field)
        $punctualityScore = $provider->on_time_delivery_rate;

        // Response Quality (based on average response time)
        $responseQuality = $this->calculateResponseQuality($provider->average_response_time_minutes);

        return [
            'completion_rate' => round($completionRate, 2),
            'rating_score' => round($ratingScore, 2),
            'cancellation_score' => round($cancellationScore, 2),
            'complaint_score' => round($complaintScore, 2),
            'punctuality_score' => round($punctualityScore, 2),
            'response_quality' => round($responseQuality, 2),
            'total_orders' => $totalOrders,
            'completed_orders' => $completedOrders,
            'cancelled_orders' => $cancelledOrders,
            'disputed_orders' => $disputedOrders,
        ];
    }

    /**
     * Calculate response quality score based on average response time
     *
     * @param int $averageMinutes
     * @return float Score between 0-100
     */
    private function calculateResponseQuality(int $averageMinutes): float
    {
        // Perfect score (100) if response within 5 minutes
        // Decreases to 0 at 60+ minutes
        if ($averageMinutes <= 5) {
            return 100;
        }

        if ($averageMinutes >= 60) {
            return 0;
        }

        // Linear decrease from 100 to 0 between 5 and 60 minutes
        return 100 - (($averageMinutes - 5) / 55 * 100);
    }

    /**
     * Update metrics for a provider (to be called after orders/reviews)
     *
     * @param ServiceProvider $provider
     * @return void
     */
    public function updateProviderMetrics(ServiceProvider $provider): void
    {
        $orders = Order::where('provider_id', $provider->id);

        // Update total cancellations
        $totalCancellations = (clone $orders)->where('status', OrderStatus::CANCELLED)->count();
        $totalComplaints = (clone $orders)->whereNotNull('dispute_reason')->count();

        // Calculate on-time delivery rate
        $completedOrders = (clone $orders)->where('status', OrderStatus::COMPLETED);
        $totalCompleted = $completedOrders->count();

        if ($totalCompleted > 0) {
            $onTimeDeliveries = $completedOrders
                ->whereColumn('completed_at', '<=', 'expected_delivery_date')
                ->count();

            $onTimeRate = ($onTimeDeliveries / $totalCompleted) * 100;
        } else {
            $onTimeRate = 0;
        }

        // Calculate acceptance rate
        $totalOrders = $orders->count();
        $acceptedOrders = (clone $orders)->whereIn('status', [
            OrderStatus::ACCEPTED,
            OrderStatus::IN_PROGRESS,
            OrderStatus::DELIVERED,
            OrderStatus::COMPLETED,
        ])->count();

        $acceptanceRate = $totalOrders > 0
            ? ($acceptedOrders / $totalOrders) * 100
            : 0;

        // Update provider
        $provider->update([
            'total_cancellations' => $totalCancellations,
            'total_complaints' => $totalComplaints,
            'on_time_delivery_rate' => round($onTimeRate, 2),
            'acceptance_rate' => round($acceptanceRate, 2),
            'last_active_at' => now(),
        ]);

        // Trigger score recalculation
        $this->updateSaluScore($provider);
    }

    /**
     * Get badge color for UI
     *
     * @param string|null $badge
     * @return string Tailwind color class
     */
    public function getBadgeColor(?string $badge): string
    {
        return match ($badge) {
            'platinum' => 'purple',
            'gold' => 'yellow',
            'silver' => 'gray',
            'bronze' => 'orange',
            default => 'gray',
        };
    }

    /**
     * Get providers by minimum score
     *
     * @param int $minScore
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getTopProviders(int $minScore = 75)
    {
        return ServiceProvider::where('salu_score', '>=', $minScore)
            ->orderBy('salu_score', 'desc')
            ->get();
    }
}
