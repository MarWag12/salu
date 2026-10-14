<?php

namespace App\Http\Controllers;

use App\Services\WalletService;
use App\Services\PaymentService;
use App\Models\WalletTopUpRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WalletController extends Controller
{
    public function __construct(
        protected WalletService $walletService,
        protected PaymentService $paymentService
    ) {}

    /**
     * Display wallet dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $balanceSummary = $this->walletService->getBalanceSummary($user);
        $transactions = $this->walletService->getTransactionHistory($user, 50);
        $wallet = $this->walletService->getOrCreateWallet($user);

        // Get active holds
        $activeHolds = $wallet->activeHolds()
            ->with('order.service')
            ->get()
            ->map(function ($hold) {
                return [
                    'id' => $hold->id,
                    'amount' => $hold->amount,
                    'formatted_amount' => $hold->formatted_amount,
                    'status' => $hold->status,
                    'status_label' => $hold->status_label,
                    'created_at' => $hold->created_at,
                    'order' => [
                        'id' => $hold->order->id,
                        'reference' => $hold->order->reference,
                        'service_name' => $hold->order->service->title,
                    ],
                ];
            });

        // Get pending top-up requests
        $pendingTopUps = WalletTopUpRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'amount' => $request->amount,
                    'formatted_amount' => $request->formatted_amount,
                    'status' => $request->status,
                    'status_label' => $request->status_label,
                    'created_at' => $request->created_at,
                ];
            });

        return Inertia::render('Wallet/Index', [
            'balance' => $balanceSummary,
            'pending_top_ups' => $pendingTopUps,
            'transactions' => $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'reference' => $transaction->reference,
                    'type' => $transaction->type,
                    'type_label' => $transaction->type_label,
                    'amount' => $transaction->amount,
                    'formatted_amount' => $transaction->formatted_amount,
                    'description' => $transaction->description,
                    'status' => $transaction->status,
                    'status_label' => $transaction->status_label,
                    'status_color' => $transaction->status_color,
                    'created_at' => $transaction->created_at,
                    'order' => $transaction->order ? [
                        'id' => $transaction->order->id,
                        'reference' => $transaction->order->reference,
                    ] : null,
                ];
            }),
            'active_holds' => $activeHolds,
        ]);
    }

    /**
     * Show top-up form.
     */
    public function topUpForm(): Response
    {
        return Inertia::render('Wallet/TopUp', [
            'suggested_amounts' => [500, 1000, 2000, 5000, 10000],
        ]);
    }

    /**
     * Process wallet top-up payment.
     */
    public function processTopUp(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:100|max:1000000',
            'payment_method' => 'required|string|in:stripe,simulation,direct',
        ]);

        if ($request->input('payment_method') === 'simulation' && !config('salu.simulated_payments')) {
            return back()->withErrors(['payment_method' => 'Os pagamentos simulados não estão disponíveis neste ambiente.']);
        }

        try {
            $user = $request->user();
            $amount = $request->input('amount');
            $paymentMethod = $request->input('payment_method');

            // Direct balance addition (internal system - creates pending request)
            if ($paymentMethod === 'direct') {
                // Create pending top-up request
                WalletTopUpRequest::create([
                    'user_id' => $user->id,
                    'amount' => $amount,
                    'currency' => 'AOA',
                    'status' => 'pending',
                    'notes' => $request->input('notes'),
                    'metadata' => [
                        'method' => 'direct',
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ],
                ]);

                return redirect()
                    ->route('wallet.index')
                    ->with('success', 'Pedido de recarga enviado! Aguarde aprovação do administrador. ⏳');
            }

            // External payment gateway (Stripe or Simulation)
            $result = $this->paymentService->initiateWalletTopUp(
                $user,
                $amount,
                $paymentMethod
            );

            // Redirect to checkout URL
            return redirect($result['checkout_url']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()
                ->back()
                ->withErrors($e->errors());
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->withErrors(['error' => 'Erro ao processar pagamento: ' . $e->getMessage()]);
        }
    }

    /**
     * Show successful top-up page.
     */
    public function topUpSuccess(Request $request)
    {
        $paymentId = $request->query('payment_id');

        if ($paymentId) {
            $payment = \App\Models\Payment::where('user_id', $request->user()->id)->findOrFail($paymentId);

            return Inertia::render('Wallet/TopUpSuccess', [
                'payment' => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'formatted_amount' => $payment->formatted_amount,
                    'status' => $payment->status->value,
                    'gateway' => $payment->gateway->value,
                    'created_at' => $payment->created_at,
                ],
            ]);
        }

        return Inertia::render('Wallet/TopUpSuccess');
    }

    /**
     * Show failed/cancelled top-up page.
     */
    public function topUpCancel(Request $request)
    {
        $paymentId = $request->query('payment_id');

        if ($paymentId) {
            $payment = \App\Models\Payment::where('user_id', $request->user()->id)->find($paymentId);

            return Inertia::render('Wallet/TopUpCancel', [
                'payment' => $payment ? [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'formatted_amount' => $payment->formatted_amount,
                    'status' => $payment->status->value,
                    'gateway' => $payment->gateway->value,
                ] : null,
            ]);
        }

        return Inertia::render('Wallet/TopUpCancel');
    }

    /**
     * Get current balance (API endpoint).
     */
    public function getBalance(Request $request)
    {
        $user = $request->user();
        $balanceSummary = $this->walletService->getBalanceSummary($user);

        return response()->json($balanceSummary);
    }

    /**
     * Check if user has sufficient balance.
     */
    public function checkBalance(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        $amount = $request->input('amount');

        $hasSufficient = $this->walletService->hasSufficientBalance($user, $amount);
        $balanceSummary = $this->walletService->getBalanceSummary($user);

        return response()->json([
            'has_sufficient_balance' => $hasSufficient,
            'available_balance' => $balanceSummary['available_balance'],
            'formatted_available' => $balanceSummary['formatted_available'],
        ]);
    }

    /**
     * Get transaction details.
     */
    public function showTransaction(Request $request, string $reference)
    {
        $user = $request->user();
        $wallet = $this->walletService->getOrCreateWallet($user);

        $transaction = $wallet->transactions()
            ->where('reference', $reference)
            ->with(['order.service', 'relatedUser'])
            ->firstOrFail();

        return response()->json([
            'id' => $transaction->id,
            'reference' => $transaction->reference,
            'type' => $transaction->type,
            'type_label' => $transaction->type_label,
            'amount' => $transaction->amount,
            'formatted_amount' => $transaction->formatted_amount,
            'balance_before' => $transaction->balance_before,
            'balance_after' => $transaction->balance_after,
            'description' => $transaction->description,
            'status' => $transaction->status,
            'status_label' => $transaction->status_label,
            'metadata' => $transaction->metadata,
            'created_at' => $transaction->created_at,
            'completed_at' => $transaction->completed_at,
            'order' => $transaction->order ? [
                'id' => $transaction->order->id,
                'reference' => $transaction->order->reference,
                'service_name' => $transaction->order->service->title,
            ] : null,
            'related_user' => $transaction->relatedUser ? [
                'id' => $transaction->relatedUser->id,
                'name' => $transaction->relatedUser->name,
            ] : null,
        ]);
    }
}
