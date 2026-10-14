<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Services\ReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function __construct(
        protected ReviewService $reviewService
    ) {}

    /**
     * Display reviews written by the authenticated user.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->isProvider()) {
            // Show reviews received on provider's services
            $reviews = $this->reviewService->getProviderReviews($user);
            $stats = $this->reviewService->getProviderReviewStats($user);
            $pendingResponses = $this->reviewService->getPendingResponses($user);

            return Inertia::render('Reviews/ProviderIndex', [
                'reviews' => $reviews,
                'stats' => $stats,
                'pendingResponses' => $pendingResponses,
            ]);
        }

        // Show reviews written by client
        $reviews = $this->reviewService->getUserReviews($user);

        return Inertia::render('Reviews/Index', [
            'reviews' => $reviews,
        ]);
    }

    /**
     * Show form to create a review for a service.
     */
    public function create(Request $request, Service $service): Response
    {
        $user = $request->user();

        // Check if user already reviewed
        if ($this->reviewService->hasUserReviewed($service, $user)) {
            return redirect()->route('services.show', $service)
                ->withErrors(['review' => 'Já avaliou este serviço.']);
        }

        // Check for completed orders that haven't been fully reviewed
        $completedOrder = Order::where('service_id', $service->id)
            ->where('client_id', $user->id)
            ->completed()
            ->get()
            ->filter(fn ($order) => !$order->hasFullReview())
            ->first();

        $service->load('serviceProvider.user');

        return Inertia::render('Reviews/Create', [
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->description,
                'price' => $service->price_min ?? 0,
                'price_min' => $service->price_min,
                'price_max' => $service->price_max,
                'service_provider' => [
                    'id' => $service->serviceProvider->id,
                    'company_name' => $service->serviceProvider->company_name,
                    'trading_name' => $service->serviceProvider->trading_name,
                    'display_name' => $service->serviceProvider->display_name,
                    'user' => [
                        'id' => $service->serviceProvider->user->id,
                        'name' => $service->serviceProvider->user->name,
                        'email' => $service->serviceProvider->user->email,
                    ],
                ],
            ],
            'order' => $completedOrder ? [
                'id' => $completedOrder->id,
                'reference' => $completedOrder->reference,
            ] : null,
        ]);
    }

    /**
     * Store a new review (supports separate service and provider ratings).
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'order_id' => 'nullable|exists:orders,id',
            // New separated ratings
            'service_rating' => 'required|integer|min:1|max:5',
            'service_comment' => 'nullable|string|max:1000',
            'provider_rating' => 'required|integer|min:1|max:5',
            'provider_comment' => 'nullable|string|max:1000',
            'is_anonymous' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $service = Service::findOrFail($validated['service_id']);
        $order = isset($validated['order_id'])
            ? Order::findOrFail($validated['order_id'])
            : null;

        try {
            // Create both service and provider reviews
            $this->reviewService->createSeparateReviews(
                $service,
                $user,
                $validated['service_rating'],
                $validated['service_comment'] ?? null,
                $validated['provider_rating'],
                $validated['provider_comment'] ?? null,
                $order,
                $validated['is_anonymous'] ?? false
            );

            return redirect()->route('services.show', $service)
                ->with('success', 'Avaliações publicadas com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Show form to edit a review.
     */
    public function edit(Request $request, Review $review): Response
    {
        $user = $request->user();

        if ($review->user_id !== $user->id) {
            abort(403, 'Não tem permissão para editar esta avaliação.');
        }

        // Check if still within edit window
        if ($review->created_at->diffInDays(now()) > 7) {
            return redirect()->route('reviews.index')
                ->withErrors(['review' => 'O período de edição expirou.']);
        }

        $review->load('service.serviceProvider.user');

        return Inertia::render('Reviews/Edit', [
            'review' => $review,
        ]);
    }

    /**
     * Update a review.
     */
    public function update(Request $request, Review $review): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:2000',
            'is_anonymous' => 'nullable|boolean',
        ]);

        try {
            $this->reviewService->updateReview(
                $review,
                $request->user(),
                $validated['rating'],
                $validated['comment'] ?? null,
                $validated['is_anonymous'] ?? null
            );

            return redirect()->route('reviews.index')
                ->with('success', 'Avaliação actualizada com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Delete a review.
     */
    public function destroy(Request $request, Review $review): RedirectResponse
    {
        try {
            $this->reviewService->deleteReview($review, $request->user());

            return redirect()->route('reviews.index')
                ->with('success', 'Avaliação eliminada com sucesso.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Add provider response to a review.
     */
    public function respond(Request $request, Review $review): RedirectResponse
    {
        $validated = $request->validate([
            'response' => 'required|string|max:1000',
        ]);

        try {
            $this->reviewService->addProviderResponse(
                $review,
                $request->user(),
                $validated['response']
            );

            return back()->with('success', 'Resposta publicada com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get reviews for a specific service (API endpoint).
     */
    public function serviceReviews(Request $request, Service $service)
    {
        $reviews = $this->reviewService->getServiceReviews($service, 10);
        $stats = $this->reviewService->getServiceReviewStats($service);

        return response()->json([
            'reviews' => $reviews,
            'stats' => $stats,
        ]);
    }

    /**
     * Show form to create a review for a provider (selecting a service).
     */
    public function createForProvider(Request $request, ServiceProvider $provider): Response|RedirectResponse
    {
        $user = $request->user();

        // Can't review yourself
        if ($user->serviceProvider?->id === $provider->id) {
            return redirect()->route('providers.show', $provider)
                ->withErrors(['review' => 'Não pode avaliar o seu próprio perfil.']);
        }

        // Get provider's published services
        $services = $provider->services()
            ->published()
            ->get()
            ->map(fn ($service) => [
                'id' => $service->id,
                'name' => $service->name,
                'description' => $service->short_description,
                'price' => $service->formatted_price,
                'image' => $service->getFirstMediaUrl('cover', 'thumb') ?: null,
            ]);

        // Get completed orders with this provider
        $completedOrders = Order::where('client_id', $user->id)
            ->where('provider_id', $provider->id)
            ->completed()
            ->with('service')
            ->get()
            ->filter(fn ($order) => !$order->hasFullReview())
            ->map(fn ($order) => [
                'id' => $order->id,
                'reference' => $order->reference,
                'service_id' => $order->service_id,
                'service_name' => $order->service->name,
                'completed_at' => $order->completed_at?->format('d/m/Y'),
            ]);

        return Inertia::render('Reviews/CreateForProvider', [
            'provider' => [
                'id' => $provider->id,
                'display_name' => $provider->display_name,
                'description' => $provider->description,
                'avatar' => $provider->user->avatar_url ?? null,
                'rating' => round($provider->rating, 1),
                'total_reviews' => $provider->total_reviews,
            ],
            'services' => $services,
            'completedOrders' => $completedOrders,
        ]);
    }

    /**
     * Store a review for a provider (only provider rating, no service rating).
     */
    public function storeForProvider(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'provider_id' => 'required|exists:service_providers,id',
            'service_id' => 'nullable|exists:services,id',
            'order_id' => 'nullable|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'is_anonymous' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $provider = ServiceProvider::findOrFail($validated['provider_id']);

        // Can't review yourself
        if ($user->serviceProvider?->id === $provider->id) {
            return back()->withErrors(['error' => 'Não pode avaliar o seu próprio perfil.']);
        }

        try {
            // If service_id provided, create review for that service
            // Otherwise, create a general provider review using their first service
            $service = isset($validated['service_id'])
                ? Service::findOrFail($validated['service_id'])
                : $provider->services()->published()->first();

            if (!$service) {
                return back()->withErrors(['error' => 'Este prestador não tem serviços publicados.']);
            }

            $order = isset($validated['order_id'])
                ? Order::findOrFail($validated['order_id'])
                : null;

            // Create only provider review (review_type = provider)
            $this->reviewService->createProviderOnlyReview(
                $service,
                $user,
                $validated['rating'],
                $validated['comment'] ?? null,
                $order,
                $validated['is_anonymous'] ?? false
            );

            return redirect()->route('providers.show', $provider)
                ->with('success', 'Avaliação publicada com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
