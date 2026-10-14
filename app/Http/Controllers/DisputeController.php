<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Dispute;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DisputeController extends Controller
{
    /**
     * Display a listing of disputes for the authenticated user.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $disputesQuery = Dispute::query()
            ->with(['order.service', 'client', 'provider.user'])
            ->where(function ($query) use ($user) {
                $query->where('client_id', $user->id);
                if ($user->serviceProvider) {
                    $query->orWhere('provider_id', $user->serviceProvider->id);
                }
            })
            ->latest();

        $disputes = $disputesQuery->paginate(10);

        return Inertia::render('Disputes/Index', [
            'disputes' => $disputes,
            'statuses' => Dispute::getStatuses(),
        ]);
    }

    /**
     * Show the form for creating a new dispute.
     */
    public function create(Request $request, Order $order): Response
    {
        $user = $request->user();

        // Check if user is the client of this order
        if ($order->client_id !== $user->id) {
            abort(403, 'Apenas o cliente pode abrir uma disputa.');
        }

        // Check if order can be disputed
        if (!in_array($order->status, [OrderStatus::IN_PROGRESS, OrderStatus::DELIVERED])) {
            abort(400, 'Este pedido não pode ser disputado.');
        }

        // Check if there's already an active dispute
        if ($order->activeDispute) {
            return redirect()->route('disputes.show', $order->activeDispute);
        }

        $order->load(['service', 'provider.user']);

        return Inertia::render('Disputes/Create', [
            'order' => $order,
            'reasons' => Dispute::getReasons(),
        ]);
    }

    /**
     * Store a newly created dispute.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'reason' => 'required|string|in:' . implode(',', array_keys(Dispute::getReasons())),
            'description' => 'required|string|min:20|max:2000',
            'evidence' => 'nullable|array',
            'evidence.*' => 'url',
        ]);

        $user = $request->user();
        $order = Order::with('provider')->findOrFail($validated['order_id']);

        // Check if user is the client
        if ($order->client_id !== $user->id) {
            abort(403, 'Apenas o cliente pode abrir uma disputa.');
        }

        // Check if order can be disputed
        if (!in_array($order->status, [OrderStatus::IN_PROGRESS, OrderStatus::DELIVERED])) {
            return back()->withErrors(['order' => 'Este pedido não pode ser disputado.']);
        }

        // Check for existing active dispute
        if ($order->activeDispute) {
            return redirect()->route('disputes.show', $order->activeDispute)
                ->with('info', 'Já existe uma disputa ativa para este pedido.');
        }

        // Create the dispute
        $dispute = Dispute::create([
            'order_id' => $order->id,
            'client_id' => $user->id,
            'provider_id' => $order->provider_id,
            'reason' => $validated['reason'],
            'description' => $validated['description'],
            'evidence' => $validated['evidence'] ?? null,
            'status' => Dispute::STATUS_PENDING,
        ]);

        // Update order status to disputed
        $order->dispute($validated['reason']);

        return redirect()->route('disputes.show', $dispute)
            ->with('success', 'Disputa criada com sucesso. A nossa equipa irá analisar o caso.');
    }

    /**
     * Display the specified dispute.
     */
    public function show(Request $request, Dispute $dispute): Response
    {
        $user = $request->user();

        // Check if user is involved in this dispute
        $isClient = $dispute->client_id === $user->id;
        $isProvider = $user->serviceProvider && $dispute->provider_id === $user->serviceProvider->id;

        if (!$isClient && !$isProvider) {
            abort(403, 'Você não tem permissão para ver esta disputa.');
        }

        $dispute->load(['order.service', 'client', 'provider.user', 'resolvedBy']);

        return Inertia::render('Disputes/Show', [
            'dispute' => $dispute,
            'isClient' => $isClient,
            'isProvider' => $isProvider,
            'statuses' => Dispute::getStatuses(),
            'reasons' => Dispute::getReasons(),
        ]);
    }

    /**
     * Provider responds to the dispute.
     */
    public function respond(Request $request, Dispute $dispute): RedirectResponse
    {
        $user = $request->user();

        // Check if user is the provider
        if (!$user->serviceProvider || $dispute->provider_id !== $user->serviceProvider->id) {
            abort(403, 'Apenas o prestador pode responder a esta disputa.');
        }

        // Check if dispute is still pending
        if (!$dispute->isPending()) {
            return back()->withErrors(['dispute' => 'Esta disputa não pode mais receber respostas.']);
        }

        $validated = $request->validate([
            'response' => 'required|string|min:20|max:2000',
            'evidence' => 'nullable|array',
            'evidence.*' => 'url',
        ]);

        $dispute->update([
            'provider_response' => [
                'text' => $validated['response'],
                'evidence' => $validated['evidence'] ?? [],
            ],
            'provider_responded_at' => now(),
            'status' => Dispute::STATUS_UNDER_REVIEW,
        ]);

        return back()->with('success', 'Resposta enviada com sucesso. Aguarde a análise da nossa equipa.');
    }

    /**
     * Client cancels the dispute.
     */
    public function cancel(Request $request, Dispute $dispute): RedirectResponse
    {
        $user = $request->user();

        // Check if user is the client
        if ($dispute->client_id !== $user->id) {
            abort(403, 'Apenas o cliente pode cancelar a disputa.');
        }

        // Check if dispute can be cancelled
        if (!in_array($dispute->status, [Dispute::STATUS_PENDING, Dispute::STATUS_UNDER_REVIEW])) {
            return back()->withErrors(['dispute' => 'Esta disputa não pode ser cancelada.']);
        }

        $dispute->update([
            'status' => Dispute::STATUS_CANCELLED,
            'resolution_notes' => 'Cancelado pelo cliente.',
            'resolved_at' => now(),
        ]);

        // Restore order status based on previous state
        $order = $dispute->order;
        if ($order->delivered_at) {
            $order->update(['status' => OrderStatus::DELIVERED]);
        } else {
            $order->update(['status' => OrderStatus::IN_PROGRESS]);
        }

        return redirect()->route('disputes.index')
            ->with('success', 'Disputa cancelada com sucesso.');
    }
}
