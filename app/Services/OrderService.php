<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use App\Models\Conversation;
use App\Notifications\OrderCreatedNotification;
use App\Notifications\OrderStatusChangedNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(
        protected WalletService $walletService,
        protected SaluScoreService $saluScoreService
    ) {}
    /**
     * Create a new order from a conversation/service request.
     */
    public function createOrder(
        Service $service,
        User $client,
        ?Conversation $conversation = null,
        ?float $agreedPrice = null,
        ?string $requirements = null,
        string $paymentMethod = 'wallet',
        bool $isUrgent = false
    ): Order {
        return DB::transaction(function () use ($service, $client, $conversation, $agreedPrice, $requirements, $paymentMethod, $isUrgent) {
            $basePrice = $agreedPrice ?? $service->price_min;

            // Calculate urgent fee if requested
            $urgentFee = $isUrgent ? $this->calculateUrgentFee($service, $basePrice) : 0;
            $finalPrice = $basePrice + $urgentFee;

            // For hourly services, use estimated hours to calculate hold amount
            $holdAmount = $finalPrice;
            if ($service->price_type === \App\Enums\PriceType::HOURLY && $agreedPrice) {
                // Hold 1.5x the estimated amount as buffer for hourly services
                $holdAmount = $finalPrice * 1.5;
            }

            // Hold funds in wallet if payment method is wallet
            $walletHold = null;
            $walletTransactionId = null;
            $paymentCompleted = false;

            if ($paymentMethod === 'wallet') {
                // Check if client has sufficient balance
                if (!$this->walletService->hasSufficientBalance($client, $holdAmount)) {
                    throw new \Exception('Saldo insuficiente na carteira. Por favor, recarregue sua carteira.');
                }

                // Create order first to get ID for wallet hold
                $order = Order::create([
                    'service_id' => $service->id,
                    'client_id' => $client->id,
                    'provider_id' => $service->service_provider_id,
                    'conversation_id' => $conversation?->id,
                    'status' => OrderStatus::PENDING,
                    'agreed_price' => $finalPrice,
                    'service_fee' => $this->calculateServiceFee($finalPrice),
                    'requirements' => $requirements,
                    'payment_method' => $paymentMethod,
                    'payment_completed' => false,
                    'hourly_rate' => $service->price_type === \App\Enums\PriceType::HOURLY ? $service->price_min : null,
                    'is_urgent' => $isUrgent,
                    'urgent_fee' => $urgentFee > 0 ? $urgentFee : null,
                    'urgent_requested_at' => $isUrgent ? now() : null,
                ]);

                // Hold funds in escrow
                $walletHold = $this->walletService->holdForOrder($order, $holdAmount);
                $walletTransactionId = $walletHold->transaction_id;
                $paymentCompleted = true;

                // Update order with transaction info
                $order->update([
                    'wallet_transaction_id' => $walletTransactionId,
                    'payment_completed' => $paymentCompleted,
                    'payment_completed_at' => now(),
                ]);
            } else {
                // Other payment methods (external, etc.)
                $order = Order::create([
                    'service_id' => $service->id,
                    'client_id' => $client->id,
                    'provider_id' => $service->service_provider_id,
                    'conversation_id' => $conversation?->id,
                    'status' => OrderStatus::PENDING,
                    'agreed_price' => $finalPrice,
                    'service_fee' => $this->calculateServiceFee($finalPrice),
                    'requirements' => $requirements,
                    'payment_method' => $paymentMethod,
                    'payment_completed' => false,
                    'hourly_rate' => $service->price_type === \App\Enums\PriceType::HOURLY ? $service->price_min : null,
                    'is_urgent' => $isUrgent,
                    'urgent_fee' => $urgentFee > 0 ? $urgentFee : null,
                    'urgent_requested_at' => $isUrgent ? now() : null,
                ]);
            }

            // Update conversation if exists
            if ($conversation) {
                $conversation->update(['has_order' => true]);
            }

            // Send notifications
            $order->load(['service', 'client', 'provider.user']);
            $order->provider->user->notify(new OrderCreatedNotification($order, true));
            $client->notify(new OrderCreatedNotification($order, false));

            return $order;
        });
    }

    /**
     * Calculate service fee (platform commission).
     */
    public function calculateServiceFee(float $price): float
    {
        // 10% commission
        return round($price * (config('salu.platform_fee_percent') / 100), 2);
    }

    /**
     * Calculate urgent fee based on service configuration.
     */
    public function calculateUrgentFee(Service $service, float $basePrice): float
    {
        if (!$service->supports_urgent || !$service->urgent_fee_value) {
            return 0;
        }

        if ($service->urgent_fee_type === 'percentage') {
            $urgentFee = $basePrice * ($service->urgent_fee_value / 100);
        } else {
            // Fixed fee
            $urgentFee = $service->urgent_fee_value;
        }

        // Apply limits: min 100 AOA, max 50% of base price
        $urgentFee = max(100, min($urgentFee, $basePrice * 0.5));

        return round($urgentFee, 2);
    }

    /**
     * Accept an order (provider action).
     */
    public function acceptOrder(Order $order, User $provider): Order
    {
        $this->authorizeProviderAction($order, $provider);

        if (!$order->canTransitionTo(OrderStatus::ACCEPTED)) {
            throw new \Exception('Este pedido não pode ser aceite no estado atual.');
        }

        $previousStatus = $order->status->value;
        $order->accept();

        // Send notification to client
        $order->load(['service', 'client', 'provider.user']);
        $order->client->notify(new OrderStatusChangedNotification($order, OrderStatus::ACCEPTED, true));

        // Broadcast real-time notification
        event(new OrderStatusChanged($order, $previousStatus));

        // Update provider metrics and Salu Score
        $this->saluScoreService->updateProviderMetrics($order->provider);

        return $order->fresh();
    }

    /**
     * Start working on an order.
     */
    public function startOrder(Order $order, User $provider): Order
    {
        $this->authorizeProviderAction($order, $provider);

        if (!$order->canTransitionTo(OrderStatus::IN_PROGRESS)) {
            throw new \Exception('Este pedido não pode ser iniciado no estado atual.');
        }

        $previousStatus = $order->status->value;
        $order->start();

        // Send notification to client
        $order->load(['service', 'client', 'provider.user']);
        $order->client->notify(new OrderStatusChangedNotification($order, OrderStatus::IN_PROGRESS, true));

        // Broadcast real-time notification
        event(new OrderStatusChanged($order, $previousStatus));

        return $order->fresh();
    }

    /**
     * Mark order as delivered.
     */
    public function deliverOrder(Order $order, User $provider, ?string $deliveryNotes = null): Order
    {
        $this->authorizeProviderAction($order, $provider);

        if (!$order->canTransitionTo(OrderStatus::DELIVERED)) {
            throw new \Exception('Este pedido não pode ser marcado como entregue no estado atual.');
        }

        $previousStatus = $order->status->value;
        $order->deliver($deliveryNotes);

        // Send notification to client
        $order->load(['service', 'client', 'provider.user']);
        $order->client->notify(new OrderStatusChangedNotification($order, OrderStatus::DELIVERED, true));

        // Broadcast real-time notification
        event(new OrderStatusChanged($order, $previousStatus));

        return $order->fresh();
    }

    /**
     * Complete an order (client confirms delivery).
     */
    public function completeOrder(Order $order, User $client): Order
    {
        $this->authorizeClientAction($order, $client);

        if (!$order->canTransitionTo(OrderStatus::COMPLETED)) {
            throw new \Exception('Este pedido não pode ser concluído no estado actual.');
        }

        return DB::transaction(function () use ($order, $client) {
            $order->complete();

            // Release wallet funds to provider if payment was via wallet
            if ($order->payment_method === 'wallet' && $order->payment_completed) {
                $isHourlyWithTimer = $order->service->price_type === \App\Enums\PriceType::HOURLY
                    && $order->calculated_price !== null;

                if ($isHourlyWithTimer) {
                    // Liquidação final: cobra o tempo realmente trabalhado e devolve o excedente retido.
                    $held = $this->walletService->activeHeldAmount($order);
                    $settle = min((float) $order->calculated_price, $held);
                    $this->walletService->settleDispute($order, $held - $settle);
                    $order->update([
                        'agreed_price' => $settle,
                        'service_fee' => $this->calculateServiceFee($settle),
                    ]);
                } else {
                    $this->walletService->releaseToProvider($order);
                }
            }

            // Update provider's completed services count
            $provider = $order->provider;
            $provider->increment('completed_services');

            // Update provider metrics and Salu Score
            $this->saluScoreService->updateProviderMetrics($provider);

            // Send notification to provider
            $order->load(['service', 'client', 'provider.user']);
            $order->provider->user->notify(new OrderStatusChangedNotification($order, OrderStatus::COMPLETED, false));

            return $order->fresh();
        });
    }

    /**
     * Cancel an order.
     */
    public function cancelOrder(Order $order, User $user, string $reason): Order
    {
        // Both client and provider can cancel
        $isClient = $order->client_id === $user->id;
        $isProvider = $order->provider->user_id === $user->id;

        if (!$isClient && !$isProvider) {
            throw new \Exception('Não tem permissão para cancelar este pedido.');
        }

        if (!$order->status->canBeCancelled()) {
            throw new \Exception('Este pedido não pode ser cancelado no estado actual.');
        }

        return DB::transaction(function () use ($order, $user, $reason, $isClient) {
            $previousStatus = $order->status->value;
            $order->cancel($reason);

            // Refund wallet funds to client if payment was via wallet
            if ($order->payment_method === 'wallet' && $order->payment_completed) {
                $this->walletService->refundToClient($order);
            }

            // Update provider metrics and Salu Score (cancellations affect score)
            $this->saluScoreService->updateProviderMetrics($order->provider);

            // Send notification to the other party
            $order->load(['service', 'client', 'provider.user']);

            if ($isClient) {
                $order->provider->user->notify(new OrderStatusChangedNotification($order, OrderStatus::CANCELLED, false));
            } else {
                $order->client->notify(new OrderStatusChangedNotification($order, OrderStatus::CANCELLED, true));
                // Broadcast real-time notification to client
                event(new OrderStatusChanged($order, $previousStatus));
            }

            return $order->fresh();
        });
    }

    /**
     * Open a dispute.
     */
    public function disputeOrder(Order $order, User $client, string $reason): Order
    {
        $this->authorizeClientAction($order, $client);

        if (!in_array($order->status, [OrderStatus::IN_PROGRESS, OrderStatus::DELIVERED])) {
            throw new \Exception('Só pode abrir disputa em pedidos em andamento ou entregues.');
        }

        $order->dispute($reason);

        // Update provider metrics and Salu Score (disputes affect complaint rate)
        $this->saluScoreService->updateProviderMetrics($order->provider);

        // Send notification to provider
        $order->load(['service', 'client', 'provider.user']);
        $order->provider->user->notify(new OrderStatusChangedNotification($order, OrderStatus::DISPUTED, false));

        return $order->fresh();
    }

    /**
     * Get orders for a client.
     */
    public function getClientOrders(User $client, ?OrderStatus $status = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = Order::where('client_id', $client->id)
            ->with(['service', 'provider.user', 'review'])
            ->latest();

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get orders for a provider.
     */
    public function getProviderOrders(User $provider, ?OrderStatus $status = null, int $perPage = 15): LengthAwarePaginator
    {
        $serviceProvider = $provider->serviceProvider;

        if (!$serviceProvider) {
            throw new \Exception('Utilizador não é um prestador de serviços.');
        }

        $query = Order::where('provider_id', $serviceProvider->id)
            ->with(['service', 'client', 'review'])
            ->latest();

        if ($status) {
            $query->where('status', $status);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get order statistics for a provider.
     */
    public function getProviderStats(User $provider): array
    {
        $serviceProvider = $provider->serviceProvider;

        if (!$serviceProvider) {
            return [];
        }

        $orders = Order::where('provider_id', $serviceProvider->id);

        return [
            'total' => $orders->count(),
            'pending' => $orders->clone()->where('status', OrderStatus::PENDING)->count(),
            'in_progress' => $orders->clone()->where('status', OrderStatus::IN_PROGRESS)->count(),
            'completed' => $orders->clone()->where('status', OrderStatus::COMPLETED)->count(),
            'cancelled' => $orders->clone()->where('status', OrderStatus::CANCELLED)->count(),
            'disputed' => $orders->clone()->where('status', OrderStatus::DISPUTED)->count(),
            'total_earnings' => (float) ($orders->clone()
                ->where('status', OrderStatus::COMPLETED)
                ->sum(DB::raw('agreed_price - service_fee'))),
        ];
    }

    /**
     * Get order statistics for a client.
     */
    public function getClientStats(User $client): array
    {
        $orders = Order::where('client_id', $client->id);

        return [
            'total' => $orders->count(),
            'active' => $orders->clone()->active()->count(),
            'completed' => $orders->clone()->where('status', OrderStatus::COMPLETED)->count(),
            'total_spent' => (float) $orders->clone()
                ->where('status', OrderStatus::COMPLETED)
                ->sum('agreed_price'),
        ];
    }

    /**
     * Authorize provider action.
     */
    protected function authorizeProviderAction(Order $order, User $user): void
    {
        if ($order->provider->user_id !== $user->id) {
            throw new \Exception('Não tem permissão para realizar esta acção.');
        }
    }

    /**
     * Authorize client action.
     */
    protected function authorizeClientAction(Order $order, User $user): void
    {
        if ($order->client_id !== $user->id) {
            throw new \Exception('Não tem permissão para realizar esta acção.');
        }
    }
}
