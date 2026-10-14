<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletHold;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WalletService
{
    /**
     * Platform fee percentage.
     */
    const PLATFORM_FEE_PERCENTAGE = 10;

    /**
     * Get or create wallet for user.
     */
    public function getOrCreateWallet(User $user): Wallet
    {
        return Wallet::firstOrCreate(
            ['user_id' => $user->id],
            [
                'balance' => 0,
                'available_balance' => 0,
                'held_balance' => 0,
                'currency' => 'AOA',
                'is_active' => true,
            ]
        );
    }

    /**
     * Top up wallet balance (credit).
     *
     * @param User $user
     * @param float $amount
     * @param string $description
     * @param array $metadata Additional data (e.g., gateway info)
     * @return WalletTransaction
     */
    public function topUp(User $user, float $amount, string $description = 'Recarga de carteira', array $metadata = []): WalletTransaction
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be greater than zero.');
        }

        $wallet = $this->getOrCreateWallet($user);

        return DB::transaction(function () use ($wallet, $amount, $description, $metadata) {
            // Lock wallet row for update to prevent race conditions
            $wallet = Wallet::lockForUpdate()->find($wallet->id);

            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore + $amount;

            // Update wallet balances
            $wallet->balance = $balanceAfter;
            $wallet->available_balance += $amount;
            $wallet->last_transaction_at = now();
            $wallet->save();

            // Create transaction record
            $transaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $wallet->id,
                'type' => WalletTransaction::TYPE_TOP_UP,
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => $description,
                'metadata' => $metadata,
                'completed_at' => now(),
            ]);

            return $transaction;
        });
    }

    /**
     * Hold funds in escrow for an order.
     *
     * @param Order $order
     * @param float $amount
     * @return WalletHold
     * @throws \Exception
     */
    public function holdForOrder(Order $order, float $amount): WalletHold
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Amount must be greater than zero.');
        }

        $wallet = $this->getOrCreateWallet($order->client);

        return DB::transaction(function () use ($wallet, $order, $amount) {
            // Lock wallet row for update
            $wallet = Wallet::lockForUpdate()->find($wallet->id);

            // Check if sufficient available balance
            if ($wallet->available_balance < $amount) {
                throw new \Exception('Saldo insuficiente. Disponível: ' . $wallet->formatted_available_balance);
            }

            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore; // Total balance doesn't change, just allocation

            // Move from available to held
            $wallet->available_balance -= $amount;
            $wallet->held_balance += $amount;
            $wallet->last_transaction_at = now();
            $wallet->save();

            // Create transaction record (negative amount for debit)
            $transaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $wallet->id,
                'related_user_id' => $order->provider?->user_id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_ORDER_PAYMENT,
                'amount' => -$amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => "Pagamento retido para pedido #{$order->id}",
                'metadata' => [
                    'order_reference' => $order->reference,
                    'service_id' => $order->service_id,
                ],
                'completed_at' => now(),
            ]);

            // Create hold record
            $hold = WalletHold::create([
                'wallet_id' => $wallet->id,
                'order_id' => $order->id,
                'transaction_id' => $transaction->id,
                'amount' => $amount,
                'status' => WalletHold::STATUS_ACTIVE,
            ]);

            return $hold;
        });
    }

    /**
     * Release held funds to provider after order completion.
     *
     * @param Order $order
     * @return array ['provider_transaction', 'platform_transaction']
     * @throws \Exception
     */
    public function releaseToProvider(Order $order): array
    {
        $holds = WalletHold::where('order_id', $order->id)
            ->where('status', WalletHold::STATUS_ACTIVE)
            ->get();

        if ($holds->isEmpty()) {
            throw new \Exception('No active hold found for this order.');
        }

        $hold = $holds->first();

        return DB::transaction(function () use ($hold, $holds, $order) {
            // Lock customer wallet
            $customerWallet = Wallet::lockForUpdate()->find($hold->wallet_id);

            // Get provider wallet
            $providerWallet = $this->getOrCreateWallet($order->provider->user);
            $providerWallet = Wallet::lockForUpdate()->find($providerWallet->id);

            $holdAmount = (float) $holds->sum('amount');
            $platformFee = $holdAmount * (config('salu.platform_fee_percent') / 100);
            $providerAmount = $holdAmount - $platformFee;

            // O cliente paga o valor retido na totalidade (o prestador recebe-o menos a comissão).
            $customerWallet->held_balance -= $holdAmount;
            $customerWallet->balance -= $holdAmount;
            $customerWallet->last_transaction_at = now();
            $customerWallet->save();

            // Credit provider wallet
            $providerBalanceBefore = $providerWallet->balance;
            $providerBalanceAfter = $providerBalanceBefore + $providerAmount;

            $providerWallet->balance += $providerAmount;
            $providerWallet->available_balance += $providerAmount;
            $providerWallet->last_transaction_at = now();
            $providerWallet->save();

            // Create provider transaction
            $providerTransaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $providerWallet->id,
                'related_user_id' => $order->client_id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_ESCROW_RELEASE,
                'amount' => $providerAmount,
                'balance_before' => $providerBalanceBefore,
                'balance_after' => $providerBalanceAfter,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => "Recebimento do pedido #{$order->id}",
                'metadata' => [
                    'order_reference' => $order->reference,
                    'gross_amount' => $holdAmount,
                    'platform_fee' => $platformFee,
                    'net_amount' => $providerAmount,
                ],
                'completed_at' => now(),
            ]);

            // Create platform fee transaction (in customer wallet, just for record)
            $platformTransaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $customerWallet->id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_PLATFORM_FEE,
                'amount' => -$platformFee,
                'balance_before' => $customerWallet->balance,
                'balance_after' => $customerWallet->balance, // registo informativo: já deduzido acima
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => "Taxa da plataforma (10%) - Pedido #{$order->id}",
                'metadata' => [
                    'order_reference' => $order->reference,
                    'fee_percentage' => self::PLATFORM_FEE_PERCENTAGE,
                ],
                'completed_at' => now(),
            ]);

            // Update hold status
            foreach ($holds as $h) {
                $h->status = WalletHold::STATUS_RELEASED;
                $h->released_at = now();
                $h->save();
            }

            return [
                'provider_transaction' => $providerTransaction,
                'platform_transaction' => $platformTransaction,
            ];
        });
    }

    /**
     * Refund held funds back to customer (e.g., order cancellation).
     *
     * @param Order $order
     * @return WalletTransaction
     * @throws \Exception
     */
    public function refundToClient(Order $order): WalletTransaction
    {
        $holds = WalletHold::where('order_id', $order->id)
            ->where('status', WalletHold::STATUS_ACTIVE)
            ->get();

        if ($holds->isEmpty()) {
            throw new \Exception('No active hold found for this order.');
        }

        $hold = $holds->first();

        return DB::transaction(function () use ($hold, $holds, $order) {
            // Lock wallet
            $wallet = Wallet::lockForUpdate()->find($hold->wallet_id);

            $holdAmount = (float) $holds->sum('amount');
            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore; // Total stays same

            // Move from held back to available
            $wallet->held_balance -= $holdAmount;
            $wallet->available_balance += $holdAmount;
            $wallet->last_transaction_at = now();
            $wallet->save();

            // Create refund transaction
            $transaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $wallet->id,
                'related_user_id' => $order->provider?->user_id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_REFUND,
                'amount' => $holdAmount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => "Reembolso do pedido #{$order->id}",
                'metadata' => [
                    'order_reference' => $order->reference,
                    'reason' => 'Pedido cancelado',
                ],
                'completed_at' => now(),
            ]);

            // Update hold status
            foreach ($holds as $h) {
                $h->status = WalletHold::STATUS_REVERSED;
                $h->released_at = now();
                $h->save();
            }

            return $transaction;
        });
    }

    /**
     * Total actualmente retido (em retenções activas) para um pedido.
     */
    public function activeHeldAmount(Order $order): float
    {
        return (float) WalletHold::where('order_id', $order->id)
            ->where('status', WalletHold::STATUS_ACTIVE)
            ->sum('amount');
    }

    /**
     * Liquida o dinheiro retido de um pedido em disputa.
     * Devolve $refundAmount ao cliente; o restante (se houver) é libertado ao prestador
     * (menos a comissão). Devolve null se o pedido não tiver retenção activa.
     */
    public function settleDispute(Order $order, float $refundAmount): ?array
    {
        $holds = WalletHold::where('order_id', $order->id)
            ->where('status', WalletHold::STATUS_ACTIVE)
            ->orderBy('id')
            ->get();

        if ($holds->isEmpty()) {
            return null;
        }

        $total = (float) $holds->sum('amount');
        $refund = max(0, min($refundAmount, $total));

        if ($refund >= $total) {
            $this->refundToClient($order);
            return ['refunded' => $total, 'released' => 0.0];
        }

        if ($refund <= 0) {
            $this->releaseToProvider($order);
            return ['refunded' => 0.0, 'released' => $total];
        }

        DB::transaction(function () use ($order, $holds, $refund) {
            $wallet = Wallet::lockForUpdate()->find($holds->first()->wallet_id);

            $wallet->held_balance -= $refund;
            $wallet->available_balance += $refund;
            $wallet->last_transaction_at = now();
            $wallet->save();

            WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $wallet->id,
                'related_user_id' => $order->provider?->user_id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_REFUND,
                'amount' => $refund,
                'balance_before' => $wallet->balance,
                'balance_after' => $wallet->balance,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => "Reembolso parcial (disputa) do pedido #{$order->id}",
                'metadata' => ['order_reference' => $order->reference, 'reason' => 'Disputa'],
                'completed_at' => now(),
            ]);

            // Retira o valor reembolsado das retenções, por ordem.
            $remaining = $refund;
            foreach ($holds as $h) {
                if ($remaining <= 0) break;
                $take = min((float) $h->amount, $remaining);
                $h->amount = (float) $h->amount - $take;
                if ($h->amount <= 0) {
                    $h->status = WalletHold::STATUS_REVERSED;
                    $h->released_at = now();
                }
                $h->save();
                $remaining -= $take;
            }
        });

        $this->releaseToProvider($order);

        return ['refunded' => $refund, 'released' => $total - $refund];
    }

    /**
     * Get wallet balance summary.
     */
    public function getBalanceSummary(User $user): array
    {
        $wallet = $this->getOrCreateWallet($user);

        return [
            'total_balance' => $wallet->balance,
            'available_balance' => $wallet->available_balance,
            'held_balance' => $wallet->held_balance,
            'formatted_total' => $wallet->formatted_balance,
            'formatted_available' => $wallet->formatted_available_balance,
            'formatted_held' => $wallet->formatted_held_balance,
            'currency' => $wallet->currency,
            'is_active' => $wallet->is_active,
        ];
    }

    /**
     * Get transaction history.
     */
    public function getTransactionHistory(User $user, int $limit = 50)
    {
        $wallet = $this->getOrCreateWallet($user);

        return WalletTransaction::where('wallet_id', $wallet->id)
            ->with(['order', 'relatedUser'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Generate unique transaction reference.
     */
    private function generateTransactionReference(): string
    {
        do {
            $reference = 'TXN-' . strtoupper(Str::random(8));
        } while (WalletTransaction::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Check if user has sufficient balance for amount.
     */
    public function hasSufficientBalance(User $user, float $amount): bool
    {
        $wallet = $this->getOrCreateWallet($user);
        return $wallet->hasSufficientBalance($amount);
    }

    /**
     * Create additional hold for an order (e.g., when time tracking exceeds original estimate).
     *
     * @param Order $order
     * @param float $additionalAmount
     * @param string $description
     * @return WalletHold
     * @throws \Exception
     */
    public function createAdditionalHold(Order $order, float $additionalAmount, string $description = 'Ajuste de valor'): WalletHold
    {
        if ($additionalAmount <= 0) {
            throw new \InvalidArgumentException('Additional amount must be greater than zero.');
        }

        $wallet = $this->getOrCreateWallet($order->client);

        return DB::transaction(function () use ($wallet, $order, $additionalAmount, $description) {
            // Lock wallet row for update
            $wallet = Wallet::lockForUpdate()->find($wallet->id);

            // Check if sufficient available balance
            if ($wallet->available_balance < $additionalAmount) {
                throw new \Exception('Saldo insuficiente para ajuste. Disponível: ' . $wallet->formatted_available_balance);
            }

            $balanceBefore = $wallet->balance;
            $balanceAfter = $balanceBefore; // Total balance doesn't change, just allocation

            // Move from available to held
            $wallet->available_balance -= $additionalAmount;
            $wallet->held_balance += $additionalAmount;
            $wallet->last_transaction_at = now();
            $wallet->save();

            // Create transaction record (negative amount for debit)
            $transaction = WalletTransaction::create([
                'reference' => $this->generateTransactionReference(),
                'wallet_id' => $wallet->id,
                'related_user_id' => $order->provider?->user_id,
                'order_id' => $order->id,
                'type' => WalletTransaction::TYPE_ORDER_PAYMENT,
                'amount' => -$additionalAmount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => WalletTransaction::STATUS_COMPLETED,
                'description' => $description . " - Pedido #{$order->id}",
                'metadata' => [
                    'order_reference' => $order->reference,
                    'service_id' => $order->service_id,
                    'is_additional_hold' => true,
                ],
                'completed_at' => now(),
            ]);

            // Create additional hold record
            $hold = WalletHold::create([
                'wallet_id' => $wallet->id,
                'order_id' => $order->id,
                'transaction_id' => $transaction->id,
                'amount' => $additionalAmount,
                'status' => WalletHold::STATUS_ACTIVE,
            ]);

            return $hold;
        });
    }
}
