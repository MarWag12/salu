<?php

namespace App\Policies;

use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    /**
     * Determine whether the user can view any reviews.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the review.
     */
    public function view(?User $user, Review $review): bool
    {
        // Visible reviews can be viewed by anyone
        if ($review->is_visible) {
            return true;
        }

        // Hidden reviews can only be viewed by their owner
        return $user && $review->user_id === $user->id;
    }

    /**
     * Determine whether the user can create reviews.
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create reviews
        return true;
    }

    /**
     * Determine whether the user can update the review.
     */
    public function update(User $user, Review $review): bool
    {
        // Only owner can update their review
        if ($review->user_id !== $user->id) {
            return false;
        }

        // Can only edit within 7 days
        return $review->created_at->diffInDays(now()) <= 7;
    }

    /**
     * Determine whether the user can delete the review.
     */
    public function delete(User $user, Review $review): bool
    {
        // Only owner can delete their review
        return $review->user_id === $user->id;
    }

    /**
     * Determine whether the user can respond to the review.
     */
    public function respond(User $user, Review $review): bool
    {
        // Only the service provider can respond
        if (!$user->serviceProvider) {
            return false;
        }

        // Check if review is for their service
        return $review->provider_id === $user->serviceProvider->id;
    }

    /**
     * Determine whether the user can report the review.
     */
    public function report(User $user, Review $review): bool
    {
        // Cannot report own review
        return $review->user_id !== $user->id;
    }
}
