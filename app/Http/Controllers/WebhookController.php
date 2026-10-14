<?php

namespace App\Http\Controllers;

use App\Services\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WebhookController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Handle Stripe webhook.
     */
    public function stripe(Request $request): Response
    {
        try {
            $this->paymentService->handleWebhook(
                'stripe',
                $request->getContent(),
                $request->header('Stripe-Signature', '')
            );

            return response('Webhook processed', 200);
        } catch (\Exception $e) {
            return response('Webhook processing failed: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Handle Stripe webhook for wallet top-ups.
     */
    public function stripeWallet(Request $request): Response
    {
        try {
            $this->paymentService->handleWalletTopUpWebhook(
                'stripe',
                $request->getContent(),
                $request->header('Stripe-Signature', '')
            );

            return response('Wallet webhook processed', 200);
        } catch (\Exception $e) {
            return response('Wallet webhook processing failed: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Handle simulated payment webhook.
     */
    public function simulated(Request $request): Response
    {
        try {
            $this->paymentService->handleWebhook(
                'simulated',
                $request->getContent(),
                $request->header('X-Signature', '')
            );

            return response('Webhook processed', 200);
        } catch (\Exception $e) {
            return response('Webhook processing failed: ' . $e->getMessage(), 400);
        }
    }
}
