<?php

namespace App\Services;

use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Enums\ServiceStatus;
use App\Models\HighlightPlan;
use App\Models\Payment;
use App\Models\Service;
use App\Notifications\ServiceStatusChanged;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        protected PaymentGatewayManager $gatewayManager,
        protected WalletService $walletService
    ) {}

    /**
     * Initiate a payment for highlighting a service.
     *
     * @return array{payment: Payment, checkout_url: string}
     */
    public function initiateHighlightPayment(
        Service $service,
        HighlightPlan $plan,
        string $gatewayName = null
    ): array {
        // Validate service is eligible for highlight
        $this->validateServiceForHighlight($service);

        // Validate plan is active
        if (!$plan->is_active) {
            throw ValidationException::withMessages([
                'plan' => 'O plano seleccionado não está disponível.',
            ]);
        }

        return DB::transaction(function () use ($service, $plan, $gatewayName) {
            // Create payment record
            $payment = Payment::create([
                'service_id' => $service->id,
                'service_provider_id' => $service->service_provider_id,
                'highlight_plan_id' => $plan->id,
                'gateway' => $this->mapGatewayNameToEnum($gatewayName ?? $this->gatewayManager->getDefaultGateway()),
                'amount' => $plan->price,
                'currency' => $plan->currency,
                'status' => PaymentStatus::PENDING,
            ]);

            // Get gateway and create checkout session
            $gateway = $this->gatewayManager->gateway($gatewayName);
            $checkoutData = $gateway->createCheckoutSession($payment);

            // Store external ID
            $payment->update([
                'external_id' => $checkoutData['external_id'],
            ]);

            return [
                'payment' => $payment,
                'checkout_url' => $checkoutData['checkout_url'],
            ];
        });
    }

    /**
     * Process a successful payment and activate highlight.
     */
    public function processSuccessfulPayment(Payment $payment): Service
    {
        return DB::transaction(function () use ($payment) {
            // Mark payment as completed
            $payment->markAsCompleted();

            // Get the service and activate highlight
            $service = $payment->service;
            $oldStatus = $service->status;

            $service->update([
                'status' => ServiceStatus::FEATURED,
                'highlight_expires_at' => now()->addDays($payment->highlightPlan->duration_days),
            ]);

            // Notify provider
            $service->serviceProvider->user->notify(
                new ServiceStatusChanged($service, $oldStatus, ServiceStatus::FEATURED)
            );

            return $service;
        });
    }

    /**
     * Process a failed payment.
     */
    public function processFailedPayment(Payment $payment, array $gatewayResponse = []): Payment
    {
        $payment->markAsFailed($gatewayResponse);

        return $payment;
    }

    /**
     * Handle webhook from payment gateway.
     */
    public function handleWebhook(
        string $gatewayName,
        string $payload,
        string $signature
    ): ?Payment {
        $gateway = $this->gatewayManager->gateway($gatewayName);

        // Verify signature
        if (!$gateway->verifyWebhookSignature($payload, $signature)) {
            throw ValidationException::withMessages([
                'signature' => 'Assinatura do webhook inválida.',
            ]);
        }

        // Parse webhook data
        $webhookData = $gateway->parseWebhookPayload($payload);
        $externalId = $webhookData['external_id'];

        // Find the payment
        $payment = Payment::where('external_id', $externalId)->first();

        if (!$payment) {
            return null;
        }

        // Already processed
        if (!$payment->isPending()) {
            return $payment;
        }

        // Process based on status
        if ($gateway->isPaymentSuccessful($webhookData)) {
            $this->processSuccessfulPayment($payment);
        } else {
            $this->processFailedPayment($payment, $webhookData);
        }

        return $payment->fresh();
    }

    /**
     * Get available highlight plans.
     */
    public function getAvailablePlans()
    {
        return HighlightPlan::active()
            ->orderBy('price')
            ->get();
    }

    /**
     * Validate that a service can be highlighted.
     */
    protected function validateServiceForHighlight(Service $service): void
    {
        // Service must be published
        if (!in_array($service->status, [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED])) {
            throw ValidationException::withMessages([
                'service' => 'Apenas serviços publicados podem ser destacados.',
            ]);
        }

        // Provider must have approved KYC
        if (!$service->serviceProvider->hasApprovedKyc()) {
            throw ValidationException::withMessages([
                'provider' => 'A verificação KYC do prestador deve estar aprovada.',
            ]);
        }

        // Check for pending payments
        $hasPendingPayment = Payment::where('service_id', $service->id)
            ->pending()
            ->exists();

        if ($hasPendingPayment) {
            throw ValidationException::withMessages([
                'payment' => 'Existe um pagamento pendente para este serviço.',
            ]);
        }
    }

    /**
     * Map gateway name to enum.
     */
    protected function mapGatewayNameToEnum(string $name): PaymentGateway
    {
        return match ($name) {
            'simulated', 'simulation' => PaymentGateway::SIMULATION,
            'stripe' => PaymentGateway::STRIPE,
            'paypal' => PaymentGateway::PAYPAL,
            'mpesa' => PaymentGateway::MPESA,
            default => PaymentGateway::SIMULATION,
        };
    }

    /**
     * Initiate wallet top-up payment.
     *
     * @param \App\Models\User $user
     * @param float $amount
     * @param string $gatewayName
     * @return array{payment: Payment, checkout_url: string}
     */
    public function initiateWalletTopUp(
        \App\Models\User $user,
        float $amount,
        string $gatewayName = 'stripe'
    ): array {
        if ($amount < 100) {
            throw ValidationException::withMessages([
                'amount' => 'O valor mínimo para recarga é 100 AOA.',
            ]);
        }

        if ($amount > 100000) {
            throw ValidationException::withMessages([
                'amount' => 'O valor máximo para recarga é 100.000 AOA.',
            ]);
        }

        return DB::transaction(function () use ($user, $amount, $gatewayName) {
            // Create payment record for wallet top-up
            $payment = Payment::create([
                'user_id' => $user->id,
                'gateway' => $this->mapGatewayNameToEnum($gatewayName),
                'amount' => $amount,
                'currency' => 'AOA',
                'status' => PaymentStatus::PENDING,
                'type' => 'wallet_topup',
            ]);

            // Get gateway and create checkout session
            $gateway = $this->gatewayManager->gateway($gatewayName);
            $checkoutData = $gateway->createCheckoutSession($payment);

            // Store external ID
            $payment->update([
                'external_id' => $checkoutData['external_id'],
            ]);

            return [
                'payment' => $payment,
                'checkout_url' => $checkoutData['checkout_url'],
            ];
        });
    }

    /**
     * Process successful wallet top-up.
     */
    public function processWalletTopUp(Payment $payment): \App\Models\User
    {
        if ($payment->type !== 'wallet_topup') {
            throw new \Exception('This payment is not a wallet top-up.');
        }

        return DB::transaction(function () use ($payment) {
            // Mark payment as completed
            $payment->markAsCompleted();

            // Get user and add funds to wallet
            $user = $payment->user;

            $this->walletService->topUp(
                $user,
                $payment->amount,
                "Recarga via {$payment->gateway->value}",
                [
                    'payment_id' => $payment->id,
                    'gateway' => $payment->gateway->value,
                    'external_id' => $payment->external_id,
                ]
            );

            return $user;
        });
    }

    /**
     * Handle wallet top-up webhook.
     */
    public function handleWalletTopUpWebhook(
        string $gatewayName,
        string $payload,
        string $signature
    ): ?Payment {
        $gateway = $this->gatewayManager->gateway($gatewayName);

        // Verify signature
        if (!$gateway->verifyWebhookSignature($payload, $signature)) {
            throw ValidationException::withMessages([
                'signature' => 'Assinatura do webhook inválida.',
            ]);
        }

        // Parse webhook data
        $webhookData = $gateway->parseWebhookPayload($payload);
        $externalId = $webhookData['external_id'];

        // Find the payment
        $payment = Payment::where('external_id', $externalId)
            ->where('type', 'wallet_topup')
            ->first();

        if (!$payment) {
            return null;
        }

        // Already processed
        if (!$payment->isPending()) {
            return $payment;
        }

        // Process based on status
        if ($gateway->isPaymentSuccessful($webhookData)) {
            $this->processWalletTopUp($payment);
        } else {
            $this->processFailedPayment($payment, $webhookData);
        }

        return $payment->fresh();
    }
}
