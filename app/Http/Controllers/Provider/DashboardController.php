<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the provider dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        return Inertia::render('Provider/Dashboard', [
            'provider' => $provider ? [
                'id' => $provider->id,
                'display_name' => $provider->display_name,
                'is_verified' => $provider->is_verified,
                'rating' => $provider->rating,
                'total_reviews' => $provider->total_reviews,
                'completed_services' => $provider->completed_services,
            ] : null,
            'stats' => [
                'total_services' => $provider?->services()->count() ?? 0,
                'published_services' => $provider?->published_services_count ?? 0,
                'pending_services' => $provider?->services()->pending()->count() ?? 0,
                'featured_services' => $provider?->services()->featured()->count() ?? 0,
            ],
            'kyc_status' => $provider?->latestKycVerification?->status->value ?? null,
            'has_approved_kyc' => $provider?->hasApprovedKyc() ?? false,
        ]);
    }
}
