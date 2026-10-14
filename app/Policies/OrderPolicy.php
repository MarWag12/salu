<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine whether the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        // Client can view their own orders
        if ($order->client_id === $user->id) {
            return true;
        }

        // Provider can view orders for their services
        if ($user->serviceProvider && $order->provider_id === $user->serviceProvider->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create orders.
     */
    public function create(User $user): bool
    {
        // Any authenticated user can create orders
        return true;
    }

    /**
     * Determine whether the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        // Only provider can update order status
        return $user->serviceProvider && $order->provider_id === $user->serviceProvider->id;
    }

    /**
     * Determine whether the user can cancel the order.
     */
    public function cancel(User $user, Order $order): bool
    {
        // Client can cancel their own pending orders
        if ($order->client_id === $user->id && $order->isPending()) {
            return true;
        }

        // Provider can cancel pending orders
        if ($user->serviceProvider && $order->provider_id === $user->serviceProvider->id && $order->isPending()) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can accept the order.
     */
    public function accept(User $user, Order $order): bool
    {
        return $user->serviceProvider &&
               $order->provider_id === $user->serviceProvider->id &&
               $order->isPending();
    }

    /**
     * Determine whether the user can reject the order.
     */
    public function reject(User $user, Order $order): bool
    {
        return $user->serviceProvider &&
               $order->provider_id === $user->serviceProvider->id &&
               $order->isPending();
    }

    /**
     * Determine whether the user can mark the order as delivered.
     */
    public function deliver(User $user, Order $order): bool
    {
        return $user->serviceProvider &&
               $order->provider_id === $user->serviceProvider->id &&
               $order->isInProgress();
    }

    /**
     * Determine whether the user can complete the order.
     */
    public function complete(User $user, Order $order): bool
    {
        // Client confirms completion after delivery
        return $order->client_id === $user->id && $order->isDelivered();
    }

    /**
     * Determine whether the user can dispute the order.
     */
    public function dispute(User $user, Order $order): bool
    {
        // Client can dispute delivered orders
        return $order->client_id === $user->id && $order->isDelivered();
    }
}
