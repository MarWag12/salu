<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Service;
use App\Models\Wishlist;
use App\Services\SearchService;
use App\Services\RecommendationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(
        protected SearchService $searchService,
        protected RecommendationService $recommendationService
    ) {}

    /**
     * Display public listing of services.
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['q', 'search', 'category', 'category_id', 'price_min', 'price_max', 'location', 'sort', 'featured']);

        // Support 'search' as alias for 'q'
        if (!empty($filters['search']) && empty($filters['q'])) {
            $filters['q'] = $filters['search'];
        }

        // Support category slug
        if (!empty($filters['category']) && empty($filters['category_id'])) {
            $category = \App\Models\Category::where('slug', $filters['category'])->first();
            if ($category) {
                $filters['category_id'] = $category->id;
            }
        }

        // Featured filter
        if (!empty($filters['featured'])) {
            $filters['featured_only'] = true;
        }

        $services = $this->searchService->search($filters);
        $categories = $this->searchService->getCategoriesWithCounts();

        return Inertia::render('Services/Index', [
            'services' => $services->through(fn ($service) => $this->transformService($service)),
            'categories' => $categories->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'services_count' => $cat->services_count,
            ]),
            'filters' => $filters,
            'sortOptions' => [
                ['value' => 'featured', 'label' => 'Destaques'],
                ['value' => 'newest', 'label' => 'Mais Recentes'],
                ['value' => 'popular', 'label' => 'Mais Populares'],
                ['value' => 'price_asc', 'label' => 'Menor Preço'],
                ['value' => 'price_desc', 'label' => 'Maior Preço'],
            ],
        ]);
    }

    /**
     * Display a single service.
     */
    public function show(Request $request, int $id): Response
    {
        $service = $this->searchService->getService($id);

        if (!$service) {
            abort(404);
        }

        $userId = $request->user()?->id;
        $isOwnService = $userId && $service->serviceProvider->user_id === $userId;

        // Only increment view count if not the owner viewing
        if (!$isOwnService) {
            $service->incrementViews();
        }

        $relatedServices = $this->searchService->getRelatedServices($service);
        $isInWishlist = $userId ? Wishlist::where('user_id', $userId)->where('service_id', $service->id)->exists() : false;

        // Helper function to transform reviews
        $transformReview = fn ($review) => [
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'reviewer_name' => $review->reviewer_name,
            'reviewer_avatar' => $review->reviewer_avatar,
            'is_verified' => $review->is_verified,
            'is_anonymous' => $review->is_anonymous,
            'provider_response' => $review->provider_response,
            'provider_responded_at' => $review->provider_responded_at?->format('d/m/Y'),
            'created_at' => $review->created_at->format('d/m/Y'),
            'created_at_human' => $review->created_at->diffForHumans(),
        ];

        // Get SERVICE reviews (reviews specific to this service)
        $serviceReviews = Review::with('user')
            ->forService($service->id)
            ->visible()
            ->latest()
            ->take(10)
            ->get()
            ->map($transformReview);

        // Service review stats
        $serviceReviewStats = [
            'total' => Review::forService($service->id)->visible()->count(),
            'average' => round(Review::forService($service->id)->visible()->avg('rating') ?? 0, 1),
            'distribution' => [
                5 => Review::forService($service->id)->visible()->byRating(5)->count(),
                4 => Review::forService($service->id)->visible()->byRating(4)->count(),
                3 => Review::forService($service->id)->visible()->byRating(3)->count(),
                2 => Review::forService($service->id)->visible()->byRating(2)->count(),
                1 => Review::forService($service->id)->visible()->byRating(1)->count(),
            ],
        ];

        // Get PROVIDER reviews (all reviews for this provider)
        $providerId = $service->serviceProvider->id;
        $providerReviews = Review::with('user')
            ->forProvider($providerId)
            ->visible()
            ->latest()
            ->take(10)
            ->get()
            ->map($transformReview);

        // Provider review stats
        $providerReviewStats = [
            'total' => Review::forProvider($providerId)->visible()->count(),
            'average' => round(Review::forProvider($providerId)->visible()->avg('rating') ?? 0, 1),
            'distribution' => [
                5 => Review::forProvider($providerId)->visible()->byRating(5)->count(),
                4 => Review::forProvider($providerId)->visible()->byRating(4)->count(),
                3 => Review::forProvider($providerId)->visible()->byRating(3)->count(),
                2 => Review::forProvider($providerId)->visible()->byRating(2)->count(),
                1 => Review::forProvider($providerId)->visible()->byRating(1)->count(),
            ],
        ];

        // Get recommended providers
        $recommendedProviders = $this->recommendationService
            ->getRecommendedProviders($request->user(), $service, 5)
            ->map(fn ($provider) => [
                'id' => $provider->id,
                'display_name' => $provider->display_name,
                'rating' => $provider->rating,
                'total_reviews' => $provider->total_reviews,
                'completed_services' => $provider->completed_services,
                'average_response_time_minutes' => $provider->average_response_time_minutes ?? 0,
                'salu_score' => $provider->salu_score ?? 0,
                'salu_badge' => $provider->salu_badge,
            ]);

        return Inertia::render('Services/Show', [
            'service' => $this->transformServiceDetail($service),
            'relatedServices' => $relatedServices->map(fn ($s) => $this->transformService($s)),
            'canContact' => $request->user() !== null && !$isOwnService,
            'isInWishlist' => $isInWishlist,
            'isOwnService' => $isOwnService,
            // Service reviews
            'serviceReviews' => $serviceReviews,
            'serviceReviewStats' => $serviceReviewStats,
            // Provider reviews
            'providerReviews' => $providerReviews,
            'providerReviewStats' => $providerReviewStats,
            // Recommendations
            'recommendedProviders' => $recommendedProviders,
        ]);
    }

    /**
     * Track contact click.
     */
    public function trackClick(Request $request, int $id)
    {
        $service = $this->searchService->getService($id);

        if ($service) {
            $service->incrementClicks();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Track recommendation click.
     */
    public function recommendationClick(Request $request, int $providerId)
    {
        $user = $request->user();

        if ($user) {
            $this->recommendationService->markAsClicked($user->id, $providerId);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Transform service for listing.
     */
    protected function transformService(Service $service): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'description' => \Str::limit($service->description, 120),
            'category' => [
                'id' => $service->category->id,
                'name' => $service->category->name,
            ],
            'provider' => [
                'name' => $service->serviceProvider->display_name,
                'rating' => $service->serviceProvider->rating,
            ],
            'price_type' => $service->price_type->value,
            'formatted_price' => $service->formatted_price,
            'location' => $service->location,
            'is_featured' => $service->isFeatured(),
            'cover_url' => $service->getFirstMediaUrl('cover', 'thumb') ?: null,
            'view_count' => $service->view_count,
        ];
    }

    /**
     * Transform service for detail view.
     */
    protected function transformServiceDetail(Service $service): array
    {
        $provider = $service->serviceProvider;
        $user = $provider->user;

        return [
            'id' => $service->id,
            'name' => $service->name,
            'description' => $service->description,
            'category' => [
                'id' => $service->category->id,
                'name' => $service->category->name,
            ],
            'provider' => [
                'id' => $provider->id,
                'name' => $provider->display_name,
                'description' => $provider->description,
                'rating' => $provider->rating,
                'total_reviews' => $provider->total_reviews,
                'completed_services' => $provider->completed_services,
                'is_verified' => $provider->is_verified,
                'member_since' => $provider->created_at->format('Y'),
                'working_hours' => $provider->working_hours,
                // Contact info
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'whatsapp' => $user->whatsapp ?? null,
                'location' => $service->location ?? $user->city ?? null,
                // Salu Score
                'salu_score' => $provider->salu_score ?? 0,
                'salu_badge' => $provider->salu_badge,
            ],
            'price_type' => $service->price_type->value,
            'price_type_label' => $service->price_type->label(),
            'price_min' => $service->price_min,
            'supports_urgent' => (bool) $service->supports_urgent,
            'price_max' => $service->price_max,
            'formatted_price' => $service->formatted_price,
            'location' => $service->location,
            'delivery_time' => $service->delivery_time,
            'tags' => $service->tags ?? [],
            'is_featured' => $service->isFeatured(),
            'cover_url' => $service->getFirstMediaUrl('cover') ?: null,
            'gallery' => $service->getMedia('gallery')->map(fn ($media) => [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'thumb' => $media->getUrl('thumb'),
            ]),
            'view_count' => $service->view_count,
            'created_at' => $service->created_at->format('d/m/Y'),
            'packages' => $service->packages->map(fn ($package) => [
                'id' => $package->id,
                'package_type' => $package->package_type,
                'name' => $package->name,
                'description' => $package->description,
                'price' => $package->price,
                'delivery_time' => $package->delivery_time,
                'features' => $package->features ?? [],
                'revisions_included' => $package->revisions_included,
                'is_active' => $package->is_active,
            ]),
        ];
    }
}
