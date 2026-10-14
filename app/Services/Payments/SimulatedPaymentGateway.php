<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGateway;
use App\Models\Payment;
use Illuminate\Support\Str;

class SimulatedPaymentGateway implements PaymentGateway
{
    public function getIdentifier(): string
    {
        return 'simulated';
    }

    public function createCheckoutSession(Payment $payment, array $options = []): array
    {
        $externalId = 'sim_' . Str::random(24);

        // Generate a simulated checkout URL that redirects to our callback
        $checkoutUrl = route('payments.simulate.checkout', [
            'payment' => $payment->id,
            'external_id' => $externalId,
        ]);

        return [
            'checkout_url' => $checkoutUrl,
            'external_id' => $externalId,
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        // In simulation mode, we verify using a simple hash
        $expectedSignature = hash_hmac('sha256', $payload, config('services.simulated.secret', 'simulated-secret'));

        return hash_equals($expectedSignature, $signature);
    }

    public function parseWebhookPayload(string $payload): array
    {
        $data = json_decode($payload, true);

        return [
            'external_id' => $data['external_id'] ?? '',
            'status' => $data['status'] ?? 'unknown',
            'metadata' => $data['metadata'] ?? [],
        ];
    }

    public function isPaymentSuccessful(array $webhookData): bool
    {
        return ($webhookData['status'] ?? '') === 'completed';
    }
}
