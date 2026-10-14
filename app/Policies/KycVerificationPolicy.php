<?php

namespace App\Policies;

use App\Models\KycVerification;
use App\Models\User;

class KycVerificationPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, KycVerification $verification): bool
    {
        // Admin can view any, provider can view their own
        return $user->isAdmin() ||
               $verification->serviceProvider->user_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only providers can create KYC verifications
        return $user->isProvider();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, KycVerification $verification): bool
    {
        // Only admin can update (approve/reject)
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, KycVerification $verification): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can approve/reject KYC.
     */
    public function review(User $user, KycVerification $verification): bool
    {
        return $user->isAdmin();
    }
}
