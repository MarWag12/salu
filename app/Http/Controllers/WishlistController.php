<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\Wishlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishlistController extends Controller
{
    /**
     * Display the user's wishlist.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $wishlistItems = Wishlist::forUser($user->id)
            ->with(['service' => function ($query) {
                $query->with(['category', 'serviceProvider.user'])
                    ->withCount('reviews')
                    ->withAvg('reviews', 'rating');
            }])
            ->latest()
            ->paginate(12)
            ->through(function ($item) {
                $service = $item->service;

                return [
                    'id' => $item->id,
                    'added_at' => $item->created_at->format('d/m/Y'),
                    'added_at_human' => $item->created_at->diffForHumans(),
                    'service' => [
                        'id' => $service->id,
                        'name' => $service->name,
                        'slug' => $service->slug,
                        'description' => $service->short_description,
                        'formatted_price' => $service->formatted_price,
                        'cover_url' => $service->cover_url,
                        'is_featured' => $service->is_featured,
                        'is_published' => $service->is_published,
                        'location' => $service->location,
                        'rating' => round($service->reviews_avg_rating ?? 0, 1),
                        'reviews_count' => $service->reviews_count ?? 0,
                        'category' => [
                            'id' => $service->category->id,
                            'name' => $service->category->name,
                        ],
                        'provider' => [
                            'id' => $service->serviceProvider->id,
                            'name' => $service->serviceProvider->display_name,
                            'is_verified' => $service->serviceProvider->is_verified,
                        ],
                    ],
                ];
            });

        return Inertia::render('Client/Wishlist', [
            'wishlistItems' => $wishlistItems,
        ]);
    }

    /**
     * Add a service to wishlist.
     */
    public function store(Request $request, Service $service): RedirectResponse
    {
        $user = $request->user();

        // Check if already in wishlist
        $exists = Wishlist::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->exists();

        if (!$exists) {
            Wishlist::create([
                'user_id' => $user->id,
                'service_id' => $service->id,
            ]);
        }

        return back()->with('success', 'Serviço adicionado aos desejos.');
    }

    /**
     * Remove a service from wishlist.
     */
    public function destroy(Request $request, Service $service): RedirectResponse
    {
        $user = $request->user();

        Wishlist::where('user_id', $user->id)
            ->where('service_id', $service->id)
            ->delete();

        return back()->with('success', 'Serviço removido dos desejos.');
    }

    /**
     * Check if a service is in the user's wishlist.
     */
    public static function isInWishlist(?int $userId, int $serviceId): bool
    {
        if (!$userId) {
            return false;
        }

        return Wishlist::where('user_id', $userId)
            ->where('service_id', $serviceId)
            ->exists();
    }
}
