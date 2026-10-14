<?php

namespace App\Services;

use App\Events\NewReviewReceived;
use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\User;
use App\Notifications\NewReviewNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReviewService
{
    public function __construct(
        protected SaluScoreService $saluScoreService
    ) {}

    /**
     * Create a new review for a service.
     */
    public function createReview(
        Service $service,
        User $user,
        int $rating,
        ?string $comment = null,
        ?Order $order = null,
        bool $isAnonymous = false
    ): Review {
        // Check if user already reviewed this service
        $alreadyReviewedService = Review::where('service_id', $service->id)
            ->where('user_id', $user->id)
            ->where('review_type', 'service')
            ->exists();

        if ($alreadyReviewedService) {
            throw new \Exception('Já avaliou este serviço anteriormente.');
        }

        // If order provided, verify it belongs to user and is completed
        if ($order) {
            if ($order->client_id !== $user->id) {
                throw new \Exception('Este pedido não pertence a si.');
            }

            if (!$order->isCompleted()) {
                throw new \Exception('Só pode avaliar serviços de pedidos concluídos.');
            }

            if ($order->review) {
                throw new \Exception('Este pedido já foi avaliado.');
            }
        }

        return DB::transaction(function () use ($service, $user, $rating, $comment, $order, $isAnonymous) {
            $review = Review::create([
                'service_id' => $service->id,
                'provider_id' => $service->service_provider_id,
                'user_id' => $user->id,
                'order_id' => $order?->id,
                'rating' => $rating,
                'comment' => $comment,
                'is_verified' => $order !== null, // Verified if from completed order
                'is_visible' => true,
                'is_anonymous' => $isAnonymous,
            ]);

            // Rating updates are handled by Review model boot events

            // Update provider Salu Score (rating affects score)
            $this->saluScoreService->updateSaluScore($service->serviceProvider);

            // Notify provider about new review
            $review->load(['service.serviceProvider.user', 'user']);
            $service->serviceProvider->user->notify(new NewReviewNotification($review));

            return $review;
        });
    }

    /**
     * Create separate reviews for service and provider.
     */
    public function createSeparateReviews(
        Service $service,
        User $user,
        int $serviceRating,
        ?string $serviceComment,
        int $providerRating,
        ?string $providerComment,
        ?Order $order = null,
        bool $isAnonymous = false
    ): array {
        // Check if user already reviewed this service
        if ($this->hasUserReviewed($service, $user)) {
            throw new \Exception('Já avaliou este serviço anteriormente.');
        }

        // If order provided, verify it belongs to user and is completed
        if ($order) {
            if ($order->client_id !== $user->id) {
                throw new \Exception('Este pedido não pertence a si.');
            }

            if (!$order->isCompleted()) {
                throw new \Exception('Só pode avaliar serviços de pedidos concluídos.');
            }

            if ($order->hasFullReview()) {
                throw new \Exception('Este pedido já foi avaliado.');
            }
        }

        return DB::transaction(function () use ($service, $user, $serviceRating, $serviceComment, $providerRating, $providerComment, $order, $isAnonymous) {
            // Create service review
            $serviceReview = Review::create([
                'service_id' => $service->id,
                'provider_id' => $service->service_provider_id,
                'review_type' => 'service',
                'user_id' => $user->id,
                'order_id' => $order?->id,
                'rating' => $serviceRating,
                'comment' => $serviceComment,
                'is_verified' => $order !== null,
                'is_visible' => true,
                'is_anonymous' => $isAnonymous,
            ]);

            // Create provider review
            $providerReview = Review::create([
                'service_id' => $service->id,
                'provider_id' => $service->service_provider_id,
                'review_type' => 'provider',
                'user_id' => $user->id,
                'order_id' => $order?->id,
                'rating' => $providerRating,
                'comment' => $providerComment,
                'is_verified' => $order !== null,
                'is_visible' => true,
                'is_anonymous' => $isAnonymous,
            ]);

            // Load relationships for notifications
            $serviceReview->load(['service.serviceProvider.user', 'user', 'provider']);
            $providerReview->load(['service.serviceProvider.user', 'user', 'provider']);

            // Update provider Salu Score (rating affects score)
            $this->saluScoreService->updateSaluScore($service->serviceProvider);

            // Notify provider about new reviews (email + database)
            $service->serviceProvider->user->notify(new NewReviewNotification($serviceReview));

            // Broadcast real-time notifications
            event(new NewReviewReceived($serviceReview));
            event(new NewReviewReceived($providerReview));

            return [
                'service_review' => $serviceReview,
                'provider_review' => $providerReview,
            ];
        });
    }

    /**
     * Update a review.
     */
    public function updateReview(
        Review $review,
        User $user,
        int $rating,
        ?string $comment = null,
        ?bool $isAnonymous = null
    ): Review {
        if ($review->user_id !== $user->id) {
            throw new \Exception('Não tem permissão para editar esta avaliação.');
        }

        // Allow editing within 7 days
        if ($review->created_at->diffInDays(now()) > 7) {
            throw new \Exception('Só pode editar avaliações até 7 dias após a criação.');
        }

        $data = [
            'rating' => $rating,
            'comment' => $comment,
        ];

        if ($isAnonymous !== null) {
            $data['is_anonymous'] = $isAnonymous;
        }

        $review->update($data);

        return $review->fresh();
    }

    /**
     * Delete a review.
     */
    public function deleteReview(Review $review, User $user): bool
    {
        if ($review->user_id !== $user->id) {
            throw new \Exception('Não tem permissão para eliminar esta avaliação.');
        }

        return $review->delete();
    }

    /**
     * Add provider response to a review.
     */
    public function addProviderResponse(Review $review, User $provider, string $response): Review
    {
        $service = $review->service;

        if ($service->serviceProvider->user_id !== $provider->id) {
            throw new \Exception('Não tem permissão para responder a esta avaliação.');
        }

        if ($review->hasResponse()) {
            throw new \Exception('Esta avaliação já tem uma resposta.');
        }

        $review->respond($response);

        return $review->fresh();
    }

    /**
     * Check if user has already reviewed a service (both service and provider reviews).
     */
    public function hasUserReviewed(Service $service, User $user): bool
    {
        // Check if user has submitted both service and provider reviews
        $serviceReviewExists = Review::where('service_id', $service->id)
            ->where('user_id', $user->id)
            ->where('review_type', 'service')
            ->exists();

        $providerReviewExists = Review::where('service_id', $service->id)
            ->where('user_id', $user->id)
            ->where('review_type', 'provider')
            ->exists();

        // User has reviewed if both types exist
        return $serviceReviewExists && $providerReviewExists;
    }

    /**
     * Get reviews for a service.
     */
    public function getServiceReviews(Service $service, int $perPage = 10): LengthAwarePaginator
    {
        return Review::where('service_id', $service->id)
            ->where('is_visible', true)
            ->with(['user'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get reviews for a provider (all services).
     */
    public function getProviderReviews(User $provider, int $perPage = 10): LengthAwarePaginator
    {
        $serviceProvider = $provider->serviceProvider;

        if (!$serviceProvider) {
            throw new \Exception('Utilizador não é um prestador de serviços.');
        }

        return Review::where('provider_id', $serviceProvider->id)
            ->where('is_visible', true)
            ->with(['user', 'service'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get reviews written by a user.
     */
    public function getUserReviews(User $user, int $perPage = 10): LengthAwarePaginator
    {
        return Review::where('user_id', $user->id)
            ->with(['service.serviceProvider.user'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get review statistics for a service.
     */
    public function getServiceReviewStats(Service $service): array
    {
        $reviews = Review::where('service_id', $service->id)
            ->where('is_visible', true);

        $ratingDistribution = $reviews->clone()
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Ensure all ratings 1-5 are present
        for ($i = 1; $i <= 5; $i++) {
            $ratingDistribution[$i] = $ratingDistribution[$i] ?? 0;
        }
        ksort($ratingDistribution);

        return [
            'total' => $reviews->count(),
            'average' => round($reviews->avg('rating') ?? 0, 2),
            'distribution' => $ratingDistribution,
            'verified_count' => $reviews->clone()->where('is_verified', true)->count(),
            'with_comments' => $reviews->clone()->whereNotNull('comment')->count(),
        ];
    }

    /**
     * Get review statistics for a provider.
     */
    public function getProviderReviewStats(User $provider): array
    {
        $serviceProvider = $provider->serviceProvider;

        if (!$serviceProvider) {
            return [];
        }

        $reviews = Review::where('provider_id', $serviceProvider->id)
            ->where('is_visible', true);

        $ratingDistribution = $reviews->clone()
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        for ($i = 1; $i <= 5; $i++) {
            $ratingDistribution[$i] = $ratingDistribution[$i] ?? 0;
        }
        ksort($ratingDistribution);

        return [
            'total' => $reviews->count(),
            'average' => round($reviews->avg('rating') ?? 0, 2),
            'distribution' => $ratingDistribution,
            'pending_responses' => $reviews->clone()->whereNull('provider_response')->count(),
        ];
    }

    /**
     * Get pending reviews that need provider response.
     */
    public function getPendingResponses(User $provider): Collection
    {
        $serviceProvider = $provider->serviceProvider;

        if (!$serviceProvider) {
            return collect();
        }

        return Review::where('provider_id', $serviceProvider->id)
            ->where('is_visible', true)
            ->whereNull('provider_response')
            ->with(['user', 'service'])
            ->latest()
            ->get();
    }

    /**
     * Report a review (for moderation).
     */
    public function reportReview(Review $review, User $reporter, string $reason): void
    {
        // For now, just hide the review and notify admin
        // In a full implementation, this would create a moderation queue item

        // TODO: Create ReviewReport model and notification system

        // Temporarily hide until reviewed
        $review->update(['is_visible' => false]);
    }

    /**
     * Create a provider-only review (without requiring service review).
     */
    public function createProviderOnlyReview(
        Service $service,
        User $user,
        int $rating,
        ?string $comment = null,
        ?Order $order = null,
        bool $isAnonymous = false
    ): Review {
        // Check if user already has a provider review for this service
        $existingReview = Review::where('service_id', $service->id)
            ->where('user_id', $user->id)
            ->where('review_type', 'provider')
            ->first();

        if ($existingReview) {
            throw new \Exception('Já avaliou este prestador para este serviço.');
        }

        // If order provided, verify it belongs to user and is completed
        if ($order) {
            if ($order->client_id !== $user->id) {
                throw new \Exception('Este pedido não pertence a si.');
            }

            if (!$order->isCompleted()) {
                throw new \Exception('Só pode avaliar serviços de pedidos concluídos.');
            }
        }

        return DB::transaction(function () use ($service, $user, $rating, $comment, $order, $isAnonymous) {
            // Create only provider review
            $review = Review::create([
                'service_id' => $service->id,
                'provider_id' => $service->service_provider_id,
                'review_type' => 'provider',
                'user_id' => $user->id,
                'order_id' => $order?->id,
                'rating' => $rating,
                'comment' => $comment,
                'is_verified' => $order !== null,
                'is_visible' => true,
                'is_anonymous' => $isAnonymous,
            ]);

            // Load relationships for notifications
            $review->load(['service.serviceProvider.user', 'user', 'provider']);

            // Notify provider about new review
            $service->serviceProvider->user->notify(new NewReviewNotification($review));

            // Broadcast real-time notification
            event(new NewReviewReceived($review));

            return $review;
        });
    }
}
