<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
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
    public function view(User $user, Conversation $conversation): bool
    {
        // Admin can view any
        if ($user->isAdmin()) {
            return true;
        }

        // User must be a participant
        return $conversation->client_id === $user->id ||
               $conversation->provider_id === $user->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Clients can always start conversations
        if ($user->isClient()) {
            return true;
        }

        // Providers can only respond if KYC approved
        if ($user->isProvider()) {
            $provider = $user->serviceProvider;
            return $provider && $provider->hasApprovedKyc();
        }

        return false;
    }

    /**
     * Determine whether the user can send messages in this conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        // Must be a participant
        if ($conversation->client_id !== $user->id && $conversation->provider_id !== $user->id) {
            return false;
        }

        // If provider, must have approved KYC
        if ($user->isProvider()) {
            $provider = $user->serviceProvider;
            return $provider && $provider->hasApprovedKyc();
        }

        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        return $user->isAdmin();
    }
}
