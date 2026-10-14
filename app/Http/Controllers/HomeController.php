<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Service;
use App\Enums\ServiceStatus;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        // Serviços em destaque (highlighted)
        $featuredServices = Service::with(['category', 'serviceProvider.user', 'media'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->where('status', ServiceStatus::FEATURED)
            ->whereNotNull('highlight_expires_at')
            ->where('highlight_expires_at', '>', now())
            ->orderBy('highlight_expires_at', 'desc')
            ->take(8)
            ->get()
            ->map(fn ($service) => [
                'id' => $service->id,
                'title' => $service->name,
                'slug' => $service->id,
                'description' => \Str::limit($service->description, 100),
                'price' => $service->price_min,
                'price_type' => $service->price_type->value,
                'category' => $service->category?->name,
                'provider' => $service->serviceProvider?->user?->name,
                'image' => $service->getFirstMediaUrl('cover', 'thumb') ?: null,
                'rating' => round($service->reviews_avg_rating ?? 0, 1),
                'reviews_count' => $service->reviews_count ?? 0,
            ]);

        // Serviços recentes
        $recentServices = Service::with(['category', 'serviceProvider.user', 'media'])
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
            ->orderBy('created_at', 'desc')
            ->take(12)
            ->get()
            ->map(fn ($service) => [
                'id' => $service->id,
                'title' => $service->name,
                'slug' => $service->id,
                'description' => \Str::limit($service->description, 100),
                'price' => $service->price_min,
                'price_type' => $service->price_type->value,
                'category' => $service->category?->name,
                'provider' => $service->serviceProvider?->user?->name,
                'image' => $service->getFirstMediaUrl('cover', 'thumb') ?: null,
                'rating' => round($service->reviews_avg_rating ?? 0, 1),
                'reviews_count' => $service->reviews_count ?? 0,
            ]);

        // Categorias com contagem de serviços
        $categories = Category::withCount(['services' => function ($query) {
            $query->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED]);
        }])
            ->orderBy('services_count', 'desc')
            ->take(8)
            ->get()
            ->map(fn ($category) => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug ?? $category->id,
                'icon' => $category->icon ?? null,
                'services_count' => $category->services_count,
            ]);

        // Estatísticas do marketplace
        $stats = [
            'total_services' => Service::whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])->count(),
            'total_providers' => \App\Models\ServiceProvider::count(),
            'total_categories' => Category::count(),
        ];

        return Inertia::render('Home', [
            'featuredServices' => $featuredServices,
            'recentServices' => $recentServices,
            'categories' => $categories,
            'stats' => $stats,
        ]);
    }

    public function updates(): Response
    {
        return Inertia::render('Updates');
    }
}
