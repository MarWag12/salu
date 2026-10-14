<?php

namespace App\Http\Controllers;

use App\Models\Payout;
use App\Models\PayoutMethod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutController extends Controller
{
    /**
     * Display the provider's wallet/earnings page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Você precisa ser um prestador de serviços.');
        }

        $payouts = $provider->payouts()
            ->with('payoutMethod')
            ->latest()
            ->paginate(10);

        $payoutMethods = $provider->payoutMethods()->get();

        // Get completed orders for earnings calculation
        $completedOrders = $provider->orders()
            ->completed()
            ->with('service')
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Provider/Wallet', [
            'balance' => [
                'available' => $provider->available_balance,
                'pending' => $provider->pending_payouts,
                'currency' => 'AOA',
            ],
            'payouts' => $payouts,
            'payoutMethods' => $payoutMethods,
            'recentOrders' => $completedOrders,
            'statuses' => Payout::getStatuses(),
        ]);
    }

    /**
     * Show the form for requesting a new payout.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Você precisa ser um prestador de serviços.');
        }

        $payoutMethods = $provider->payoutMethods()->get();

        return Inertia::render('Provider/RequestPayout', [
            'balance' => [
                'available' => $provider->available_balance,
                'pending' => $provider->pending_payouts,
                'currency' => 'AOA',
            ],
            'payoutMethods' => $payoutMethods,
            'minAmount' => config('salu.min_payout'),
        ]);
    }

    /**
     * Store a new payout request.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Você precisa ser um prestador de serviços.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:'.config('salu.min_payout'),
            'payout_method_id' => 'required|exists:payout_methods,id',
            'notes' => 'nullable|string|max:500',
        ]);

        // Verify payout method belongs to this provider
        $payoutMethod = PayoutMethod::where('id', $validated['payout_method_id'])
            ->where('provider_id', $provider->id)
            ->firstOrFail();

        // Check available balance
        if ($validated['amount'] > $provider->available_balance) {
            return back()->withErrors(['amount' => 'Saldo insuficiente para este levantamento.']);
        }

        // A comissão da plataforma já foi descontada em cada pedido concluído;
        // o levantamento não cobra uma segunda comissão.
        $fee = 0;
        $netAmount = $validated['amount'];

        // Create payout request
        Payout::create([
            'provider_id' => $provider->id,
            'payout_method_id' => $payoutMethod->id,
            'amount' => $validated['amount'],
            'fee' => $fee,
            'net_amount' => $netAmount,
            'currency' => 'AOA',
            'status' => Payout::STATUS_PENDING,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('provider.wallet')
            ->with('success', 'Pedido de levantamento criado com sucesso. Será processado em breve.');
    }

    /**
     * Display a specific payout.
     */
    public function show(Request $request, Payout $payout): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payout->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para ver este levantamento.');
        }

        $payout->load('payoutMethod');

        return Inertia::render('Provider/PayoutDetail', [
            'payout' => $payout,
            'statuses' => Payout::getStatuses(),
        ]);
    }

    /**
     * Cancel a pending payout request.
     */
    public function cancel(Request $request, Payout $payout): RedirectResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider || $payout->provider_id !== $provider->id) {
            abort(403, 'Você não tem permissão para cancelar este levantamento.');
        }

        if (!$payout->isPending()) {
            return back()->withErrors(['payout' => 'Este levantamento não pode ser cancelado.']);
        }

        $payout->update([
            'status' => Payout::STATUS_CANCELLED,
        ]);

        return redirect()->route('provider.wallet')
            ->with('success', 'Pedido de levantamento cancelado.');
    }
}
