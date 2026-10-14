<?php

namespace App\Services;

use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class SearchService
{
    /**
     * Search services with filters, sorting, and pagination.
     */
    public function search(array $filters = [], int $perPage = 12): LengthAwarePaginator
    {
        $query = Service::query()
            ->with(['category', 'serviceProvider.user', 'media'])
            ->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
            ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true));

        // Search by keyword (name, description, tags)
        if (!empty($filters['q'])) {
            $keyword = $filters['q'];
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")
                    ->orWhereJsonContains('tags', $keyword);
            });
        }

        // Filter by category
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Filter by price range
        if (!empty($filters['price_min'])) {
            $query->where('price_min', '>=', $filters['price_min']);
        }
        if (!empty($filters['price_max'])) {
            $query->where(function (Builder $q) use ($filters) {
                $q->where('price_min', '<=', $filters['price_max'])
                    ->orWhere('price_max', '<=', $filters['price_max']);
            });
        }

        // Filter by location
        if (!empty($filters['location'])) {
            $query->where('location', 'like', "%{$filters['location']}%");
        }

        // Filter by featured only
        if (!empty($filters['featured_only'])) {
            $query->where('status', ServiceStatus::FEATURED)
                ->whereNotNull('highlight_expires_at')
                ->where('highlight_expires_at', '>', now());
        }

        // Apply sorting with featured priority
        $sortBy = $filters['sort'] ?? 'featured';

        switch ($sortBy) {
            case 'price_asc':
                $query->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
                    ->orderBy('price_min', 'asc');
                break;
            case 'price_desc':
                $query->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
                    ->orderBy('price_min', 'desc');
                break;
            case 'newest':
                $query->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
                    ->orderBy('created_at', 'desc');
                break;
            case 'popular':
                $query->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
                    ->orderBy('view_count', 'desc');
                break;
            case 'featured':
            default:
                $query->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
                    ->orderBy('created_at', 'desc');
                break;
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get a single service for public view.
     */
    public function getService(int $id): ?Service
    {
        return Service::query()
            ->with(['category', 'serviceProvider.user', 'media', 'packages' => function ($query) {
                $query->active()->ordered();
            }])
            ->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
            ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true))
            ->find($id);
    }

    /**
     * Get categories with active service counts.
     */
    public function getCategoriesWithCounts(): \Illuminate\Database\Eloquent\Collection
    {
        return Category::query()
            ->active()
            ->ordered()
            ->withCount(['services' => function ($query) {
                $query->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
                    ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true));
            }])
            ->get();
    }

    /**
     * Get featured services for homepage.
     */
    public function getFeaturedServices(int $limit = 8): \Illuminate\Database\Eloquent\Collection
    {
        return Service::query()
            ->with(['category', 'serviceProvider.user', 'media'])
            ->where('status', ServiceStatus::FEATURED)
            ->where('highlight_expires_at', '>', now())
            ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true))
            ->orderBy('highlight_expires_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get recent services for homepage.
     */
    public function getRecentServices(int $limit = 8): \Illuminate\Database\Eloquent\Collection
    {
        return Service::query()
            ->with(['category', 'serviceProvider.user', 'media'])
            ->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
            ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true))
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get related services based on category.
     */
    public function getRelatedServices(Service $service, int $limit = 4): \Illuminate\Database\Eloquent\Collection
    {
        return Service::query()
            ->with(['category', 'serviceProvider.user', 'media'])
            ->where('category_id', $service->category_id)
            ->where('id', '!=', $service->id)
            ->whereIn('status', [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])
            ->whereHas('serviceProvider', fn ($q) => $q->where('is_verified', true))
            ->orderByRaw("CASE WHEN status = ? AND highlight_expires_at > CURRENT_TIMESTAMP THEN 0 ELSE 1 END", [ServiceStatus::FEATURED->value])
            ->limit($limit)
            ->get();
    }
}
