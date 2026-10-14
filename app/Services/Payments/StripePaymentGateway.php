<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Stripe\Checkout\Session;
use Stripe\Stripe;
use Stripe\Webhook;

class StripePaymentGateway implements PaymentGateway
{
    public function __construct()
    {
        Stripe::setApiKey(config('services.stripe.secret'));
    }

    public function getIdentifier(): string
    {
        return 'stripe';
    }

    public function createCheckoutSession(Payment $payment, array $options = []): array
    {
        $session = Session::create([
            'payment_method_types' => ['card'],
            'line_items' => [
                [
                    'price_data' => [
                        'currency' => strtolower($payment->highlightPlan->currency),
                        'product_data' => [
                            'name' => "Destaque: {$payment->service->name}",
                            'description' => "Plano de {$payment->highlightPlan->duration_days} dias de destaque",
                        ],
                        'unit_amount' => (int) ($payment->amount * 100), // Stripe expects cents
                    ],
                    'quantity' => 1,
                ],
            ],
            'mode' => 'payment',
            'success_url' => route('payments.success', ['payment' => $payment->id]),
            'cancel_url' => route('payments.cancel', ['payment' => $payment->id]),
            'metadata' => [
                'payment_id' => $payment->id,
                'service_id' => $payment->service_id,
                'provider_id' => $payment->service->service_provider_id,
            ],
            'client_reference_id' => (string) $payment->id,
        ]);

        return [
            'checkout_url' => $session->url,
            'external_id' => $session->id,
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        try {
            Webhook::constructEvent(
                $payload,
                $signature,
                config('services.stripe.webhook_secret')
            );

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function parseWebhookPayload(string $payload): array
    {
        $event = json_decode($payload, true);
        $session = $event['data']['object'] ?? [];

        return [
            'external_id' => $session['id'] ?? '',
            'status' => $this->mapStripeStatus($event['type'] ?? ''),
            'metadata' => $session['metadata'] ?? [],
            'event_type' => $event['type'] ?? '',
        ];
    }

    public function isPaymentSuccessful(array $webhookData): bool
    {
        return ($webhookData['event_type'] ?? '') === 'checkout.session.completed';
    }

    protected function mapStripeStatus(string $eventType): string
    {
        return match ($eventType) {
            'checkout.session.completed' => 'completed',
            'checkout.session.expired' => 'expired',
            'checkout.session.async_payment_failed' => 'failed',
            default => 'pending',
        };
    }
}
