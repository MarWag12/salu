<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SimulatedPaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Só o dono do pagamento pode usar o checkout simulado, e só se estiver activo.
     */
    protected function guard(Payment $payment): void
    {
        abort_unless(config('salu.simulated_payments'), 404);

        $user = auth()->user();
        $ownerId = $payment->user_id ?? $payment->serviceProvider?->user_id;
        abort_unless($user && $ownerId === $user->id, 403);
        abort_unless($payment->gateway === \App\Enums\PaymentGateway::SIMULATION, 404);
    }

    /**
     * Show simulated checkout page.
     */
    public function checkout(Request $request, Payment $payment)
    {
        $this->guard($payment);

        // Verify external ID matches
        if ($payment->external_id !== $request->external_id) {
            abort(404);
        }

        // Check if this is a wallet top-up
        if ($payment->type === 'wallet_topup') {
            return Inertia::render('Payments/SimulatedWalletCheckout', [
                'payment' => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency,
                    'formatted_amount' => number_format($payment->amount, 2) . ' ' . $payment->currency,
                    'type' => $payment->type,
                ],
            ]);
        }

        // Default: highlight payment
        return Inertia::render('Payments/SimulatedCheckout', [
            'payment' => $payment->load(['service', 'highlightPlan']),
        ]);
    }

    /**
     * Process simulated payment (success).
     */
    public function confirm(Payment $payment)
    {
        $this->guard($payment);

        if (!$payment->isPending()) {
            // Check payment type for redirect
            if ($payment->type === 'wallet_topup') {
                return redirect()->route('wallet.top-up.success', ['payment_id' => $payment->id]);
            }
            return redirect()->route('payments.success', ['payment' => $payment->id]);
        }

        // Process based on payment type
        if ($payment->type === 'wallet_topup') {
            $this->paymentService->processWalletTopUp($payment);
            return redirect()->route('wallet.top-up.success', ['payment_id' => $payment->id]);
        }

        // Default: highlight payment
        $this->paymentService->processSuccessfulPayment($payment);
        return redirect()->route('payments.success', ['payment' => $payment->id]);
    }

    /**
     * Process simulated payment (failure).
     */
    public function fail(Payment $payment)
    {
        $this->guard($payment);

        if (!$payment->isPending()) {
            // Check payment type for redirect
            if ($payment->type === 'wallet_topup') {
                return redirect()->route('wallet.top-up.cancel', ['payment_id' => $payment->id]);
            }
            return redirect()->route('payments.cancel', ['payment' => $payment->id]);
        }

        $this->paymentService->processFailedPayment($payment, [
            'reason' => 'user_cancelled',
            'message' => 'Pagamento cancelado pelo utilizador',
        ]);

        // Redirect based on payment type
        if ($payment->type === 'wallet_topup') {
            return redirect()->route('wallet.top-up.cancel', ['payment_id' => $payment->id]);
        }

        return redirect()->route('payments.cancel', ['payment' => $payment->id]);
    }
}
