<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Review;
use App\Models\ServiceProvider;
use App\Services\ReviewService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicProviderController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    /**
     * Display the list of providers.
     */
    public function index(Request $request): Response
    {
        $query = ServiceProvider::query()
            ->verified()
            ->with(['user', 'services' => function ($q) {
                $q->published()->with('category');
            }])
            ->withCount(['services' => function ($q) {
                $q->published();
            }]);

        // Filter by category
        if ($request->filled('category')) {
            $categorySlug = $request->category;
            $query->whereHas('services', function ($q) use ($categorySlug) {
                $q->published()->whereHas('category', function ($cq) use ($categorySlug) {
                    $cq->where('slug', $categorySlug);
                });
            });
        }

        // Search by name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('trading_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort options
        $sortBy = $request->get('sort', 'rating');
        switch ($sortBy) {
            case 'reviews':
                $query->orderByDesc('total_reviews');
                break;
            case 'services':
                $query->orderByDesc('services_count');
                break;
            case 'recent':
                $query->latest();
                break;
            case 'rating':
            default:
                $query->orderByDesc('rating')->orderByDesc('total_reviews');
                break;
        }

        $providers = $query->paginate(12)->withQueryString();

        // Transform providers for the frontend
        $providers->getCollection()->transform(function ($provider) {
            // Get unique categories from provider's services
            $categories = $provider->services
                ->pluck('category')
                ->filter()
                ->unique('id')
                ->values()
                ->map(fn ($cat) => [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'icon' => $cat->icon,
                ]);

            return [
                'id' => $provider->id,
                'display_name' => $provider->display_name,
                'description' => $provider->description,
                'avatar' => $provider->user->avatar_url ?? null,
                'is_verified' => $provider->is_verified,
                'is_featured' => $provider->is_featured,
                'rating' => round($provider->rating ?? 0, 1),
                'total_reviews' => $provider->total_reviews ?? 0,
                'completed_services' => $provider->completed_services ?? 0,
                'services_count' => $provider->services_count,
                'categories' => $categories,
                'member_since' => $provider->created_at->format('Y'),
            ];
        });

        // Get all active categories for the filter
        $categories = Category::active()
            ->ordered()
            ->withCount(['services' => function ($q) {
                $q->published();
            }])
            ->whereHas('services', fn ($q) => $q->published())
            ->get()
            ->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'icon' => $cat->icon,
                'services_count' => $cat->services_count,
            ]);

        return Inertia::render('Providers/Index', [
            'providers' => $providers,
            'categories' => $categories,
            'filters' => [
                'category' => $request->category,
                'search' => $request->search,
                'sort' => $sortBy,
            ],
        ]);
    }

    /**
     * Display the public provider profile.
     */
    public function show(Request $request, ServiceProvider $provider): Response
    {
        $provider->load(['user', 'services' => function ($query) {
            $query->published()
                ->withCount('reviews')
                ->withAvg('reviews', 'rating')
                ->latest()
                ->take(6);
        }]);

        // Get provider statistics
        $stats = $this->getProviderStats($provider);

        // Get reviews with pagination
        $reviews = Review::whereHas('service', function ($query) use ($provider) {
            $query->where('service_provider_id', $provider->id);
        })
            ->where('is_visible', true)
            ->with(['service'])
            ->latest()
            ->paginate(10);

        // Transform reviews to include anonymous handling
        $reviews->getCollection()->transform(function ($review) {
            return [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'reviewer_name' => $review->reviewer_name,
                'reviewer_avatar' => $review->reviewer_avatar,
                'is_verified' => $review->is_verified,
                'is_anonymous' => $review->is_anonymous,
                'service_name' => $review->service->name,
                'provider_response' => $review->provider_response,
                'provider_responded_at' => $review->provider_responded_at?->format('d/m/Y'),
                'created_at' => $review->created_at->format('d/m/Y'),
                'created_at_human' => $review->created_at->diffForHumans(),
            ];
        });

        // Get rating distribution
        $ratingDistribution = $this->getRatingDistribution($provider);

        $user = $provider->user;

        return Inertia::render('Provider/PublicProfile', [
            'provider' => [
                'id' => $provider->id,
                'display_name' => $provider->display_name,
                'description' => $provider->description,
                'avatar' => $user->avatar_url ?? null,
                'is_verified' => $provider->is_verified,
                'rating' => round($provider->rating, 1),
                'total_reviews' => $provider->total_reviews,
                'completed_services' => $provider->completed_services,
                'member_since' => $provider->created_at->format('Y'),
                'years_active' => $provider->created_at->diffInYears(now()) ?: 1,
                'working_hours' => $provider->working_hours,
                // Contact info
                'email' => $user->email,
                'phone' => $user->phone ?? null,
                'whatsapp' => $user->whatsapp ?? null,
                'location' => $user->city ?? null,
            ],
            'services' => $provider->services->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'slug' => $service->slug,
                    'description' => $service->short_description,
                    'price' => $service->formatted_price,
                    'image' => $service->getFirstMediaUrl('cover', 'thumb') ?: ($service->getFirstMediaUrl('cover') ?: null),
                    'rating' => round($service->reviews_avg_rating ?? 0, 1),
                    'reviews_count' => $service->reviews_count,
                    'is_featured' => $service->isFeatured(),
                ];
            }),
            'stats' => $stats,
            'reviews' => $reviews,
            'ratingDistribution' => $ratingDistribution,
        ]);
    }

    /**
     * Get provider statistics.
     */
    private function getProviderStats(ServiceProvider $provider): array
    {
        $reviewsQuery = Review::whereHas('service', function ($query) use ($provider) {
            $query->where('service_provider_id', $provider->id);
        })->where('is_visible', true);

        return [
            'total_reviews' => $provider->total_reviews,
            'average_rating' => round($provider->rating, 1),
            'completed_services' => $provider->completed_services,
            'published_services' => $provider->services()->published()->count(),
            'verified_reviews' => $reviewsQuery->clone()->where('is_verified', true)->count(),
            'reviews_with_comments' => $reviewsQuery->clone()->whereNotNull('comment')->where('comment', '!=', '')->count(),
            'response_rate' => $this->calculateResponseRate($provider),
        ];
    }

    /**
     * Calculate provider response rate to reviews.
     */
    private function calculateResponseRate(ServiceProvider $provider): int
    {
        $reviews = Review::whereHas('service', function ($query) use ($provider) {
            $query->where('service_provider_id', $provider->id);
        })->where('is_visible', true);

        $total = $reviews->count();
        if ($total === 0) {
            return 0;
        }

        $responded = $reviews->clone()->whereNotNull('provider_response')->count();

        return round(($responded / $total) * 100);
    }

    /**
     * Get rating distribution for the provider.
     */
    private function getRatingDistribution(ServiceProvider $provider): array
    {
        $distribution = [];

        for ($i = 5; $i >= 1; $i--) {
            $count = Review::whereHas('service', function ($query) use ($provider) {
                $query->where('service_provider_id', $provider->id);
            })
                ->where('is_visible', true)
                ->where('rating', $i)
                ->count();

            $distribution[$i] = $count;
        }

        $total = array_sum($distribution);

        return [
            'distribution' => $distribution,
            'total' => $total,
            'percentages' => array_map(function ($count) use ($total) {
                return $total > 0 ? round(($count / $total) * 100) : 0;
            }, $distribution),
        ];
    }
}
