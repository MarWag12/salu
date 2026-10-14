<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Service $service): bool
    {
        // Admin can view any
        if ($user->isAdmin()) {
            return true;
        }

        // Provider can view their own services
        if ($user->isProvider() && $service->serviceProvider->user_id === $user->id) {
            return true;
        }

        // Public can view published/featured services only
        return $service->isPubliclyVisible();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only verified providers can create services
        if (!$user->isProvider()) {
            return false;
        }

        $provider = $user->serviceProvider;

        return $provider && $provider->hasApprovedKyc();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Service $service): bool
    {
        // Admin can update any
        if ($user->isAdmin()) {
            return true;
        }

        // Provider can update their own services
        return $user->isProvider() &&
               $service->serviceProvider->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Service $service): bool
    {
        // Admin can delete any
        if ($user->isAdmin()) {
            return true;
        }

        // Provider can delete their own services
        return $user->isProvider() &&
               $service->serviceProvider->user_id === $user->id;
    }

    /**
     * Determine whether the user can approve/suspend services.
     */
    public function moderate(User $user, Service $service): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can highlight the service.
     */
    public function highlight(User $user, Service $service): bool
    {
        // Must be provider
        if (!$user->isProvider()) {
            return false;
        }

        // Must own the service
        if ($service->serviceProvider->user_id !== $user->id) {
            return false;
        }

        // Service must be published or already featured
        if (!$service->isPubliclyVisible()) {
            return false;
        }

        // Provider must have approved KYC
        return $user->serviceProvider->hasApprovedKyc();
    }
}
