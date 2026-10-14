<?php

namespace App\Http\Controllers\Client;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\Wishlist;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the client dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get order statistics
        $orders = Order::where('client_id', $user->id);

        $orderStats = [
            'total' => $orders->count(),
            'active' => $orders->clone()->active()->count(),
            'pending' => $orders->clone()->where('status', OrderStatus::PENDING)->count(),
            'in_progress' => $orders->clone()->where('status', OrderStatus::IN_PROGRESS)->count(),
            'delivered' => $orders->clone()->where('status', OrderStatus::DELIVERED)->count(),
            'completed' => $orders->clone()->where('status', OrderStatus::COMPLETED)->count(),
            'total_spent' => (float) $orders->clone()
                ->where('status', OrderStatus::COMPLETED)
                ->sum('agreed_price'),
        ];

        // Get recent orders
        $recentOrders = Order::where('client_id', $user->id)
            ->with(['service', 'provider.user'])
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'reference' => $order->reference,
                    'service_name' => $order->service->name,
                    'provider_name' => $order->provider->trading_name ?? $order->provider->user->name,
                    'status' => $order->status->value,
                    'status_label' => $order->status->label(),
                    'status_color' => $order->status->color(),
                    'agreed_price' => $order->agreed_price,
                    'created_at' => $order->created_at->toISOString(),
                ];
            });

        // Get user's reviews
        $reviewStats = [
            'total' => Review::where('user_id', $user->id)->count(),
            'pending_for_completed' => Order::where('client_id', $user->id)
                ->where('status', OrderStatus::COMPLETED)
                ->whereDoesntHave('review')
                ->count(),
        ];

        // Get orders awaiting review
        $ordersNeedingReview = Order::where('client_id', $user->id)
            ->where('status', OrderStatus::COMPLETED)
            ->whereDoesntHave('review')
            ->with(['service', 'provider.user'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'service_id' => $order->service->id,
                    'service_name' => $order->service->name,
                    'provider_name' => $order->provider->trading_name ?? $order->provider->user->name,
                    'completed_at' => $order->completed_at?->toISOString(),
                ];
            });

        // Get conversation stats
        $conversationStats = [
            'total' => $user->clientConversations()->count(),
            'unread' => $user->clientConversations()
                ->whereHas('messages', function ($query) use ($user) {
                    $query->where('sender_id', '!=', $user->id)
                        ->where('read_at', null);
                })
                ->count(),
        ];

        // Get favorite/recent services viewed
        $recentServices = Service::published()
            ->latest('updated_at')
            ->take(4)
            ->with(['category', 'serviceProvider.user'])
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'price' => $service->price,
                    'category' => $service->category?->name,
                    'provider_name' => $service->serviceProvider->trading_name ??
                        $service->serviceProvider->company_name ??
                        $service->serviceProvider->user->name,
                    'rating' => $service->rating,
                    'reviews_count' => $service->reviews_count,
                ];
            });

        // Get wishlist stats
        $wishlistStats = [
            'total' => Wishlist::where('user_id', $user->id)->count(),
        ];

        // Get recent wishlist items
        $wishlistItems = Wishlist::where('user_id', $user->id)
            ->with(['service' => function ($query) {
                $query->with(['category', 'serviceProvider.user']);
            }])
            ->latest()
            ->take(4)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'service_id' => $item->service->id,
                    'service_name' => $item->service->name,
                    'service_price' => $item->service->formatted_price,
                    'provider_name' => $item->service->serviceProvider->display_name,
                    'cover_url' => $item->service->cover_url,
                    'added_at' => $item->created_at->diffForHumans(),
                ];
            });

        return Inertia::render('Client/Dashboard', [
            'orderStats' => $orderStats,
            'recentOrders' => $recentOrders,
            'reviewStats' => $reviewStats,
            'ordersNeedingReview' => $ordersNeedingReview,
            'conversationStats' => $conversationStats,
            'recentServices' => $recentServices,
            'wishlistStats' => $wishlistStats,
            'wishlistItems' => $wishlistItems,
        ]);
    }
}
