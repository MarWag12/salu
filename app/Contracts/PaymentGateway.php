<?php

namespace App\Contracts;

use App\Models\Payment;

interface PaymentGateway
{
    /**
     * Get the gateway identifier.
     */
    public function getIdentifier(): string;

    /**
     * Create a checkout session for the given payment.
     *
     * @return array{checkout_url: string, external_id: string}
     */
    public function createCheckoutSession(Payment $payment, array $options = []): array;

    /**
     * Verify the webhook signature.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;

    /**
     * Parse the payment data from webhook payload.
     *
     * @return array{external_id: string, status: string, metadata: array}
     */
    public function parseWebhookPayload(string $payload): array;

    /**
     * Check if the payment was successful based on webhook data.
     */
    public function isPaymentSuccessful(array $webhookData): bool;
}
