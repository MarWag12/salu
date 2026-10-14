<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Service;
use App\Models\Conversation;
use App\Services\OrderService;
use App\Services\TimeTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected TimeTrackingService $timeTrackingService
    ) {}

    /**
     * Display orders for the authenticated user.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $status = $request->input('status') ? OrderStatus::tryFrom($request->input('status')) : null;

        if ($user->isProvider()) {
            $orders = $this->orderService->getProviderOrders($user, $status);
            $stats = $this->orderService->getProviderStats($user);
        } else {
            $orders = $this->orderService->getClientOrders($user, $status);
            $stats = $this->orderService->getClientStats($user);
        }

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
            'currentStatus' => $request->input('status'),
            'statuses' => collect(OrderStatus::cases())->map(fn($s) => [
                'value' => $s->value,
                'label' => $s->label(),
                'color' => $s->color(),
            ]),
        ]);
    }

    /**
     * Show a specific order.
     */
    public function show(Request $request, Order $order): Response
    {
        $user = $request->user();

        // Authorization check
        if ($order->client_id !== $user->id &&
            $order->provider->user_id !== $user->id &&
            !$user->isAdmin()) {
            abort(403, 'Não tem permissão para ver este pedido.');
        }

        $order->load(['service', 'client', 'provider.user', 'conversation', 'review']);

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'canReview' => $order->isCompleted() &&
                           $order->client_id === $user->id &&
                           !$order->review,
            'isProvider' => $order->provider->user_id === $user->id,
            'isClient' => $order->client_id === $user->id,
        ]);
    }

    /**
     * Create a new order from a service.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'conversation_id' => 'nullable|exists:conversations,id',
            'agreed_price' => 'nullable|numeric|min:0',
            'requirements' => 'nullable|string|max:2000',
            'is_urgent' => 'nullable|boolean',
            'payment_method' => 'nullable|in:wallet',
        ]);

        $user = $request->user();
        $service = Service::findOrFail($validated['service_id']);

        // Can't order own service
        if ($service->serviceProvider->user_id === $user->id) {
            return back()->withErrors(['service' => 'Não pode encomendar o seu próprio serviço.']);
        }

        $conversation = isset($validated['conversation_id'])
            ? Conversation::findOrFail($validated['conversation_id'])
            : null;

        try {
            $order = $this->orderService->createOrder(
                $service,
                $user,
                $conversation,
                $validated['agreed_price'] ?? null,
                $validated['requirements'] ?? null,
                $validated['payment_method'] ?? 'wallet',
                (bool) ($validated['is_urgent'] ?? false)
            );

            return redirect()->route('orders.show', $order)
                ->with('success', 'Pedido criado com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Accept an order (provider action).
     */
    public function accept(Request $request, Order $order): RedirectResponse
    {
        try {
            $this->orderService->acceptOrder($order, $request->user());

            return back()->with('success', 'Pedido aceite com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Start working on an order (provider action).
     */
    public function start(Request $request, Order $order): RedirectResponse
    {
        try {
            $this->orderService->startOrder($order, $request->user());

            return back()->with('success', 'Trabalho iniciado!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Mark order as delivered (provider action).
     */
    public function deliver(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'delivery_notes' => 'nullable|string|max:2000',
        ]);

        try {
            $this->orderService->deliverOrder(
                $order,
                $request->user(),
                $validated['delivery_notes'] ?? null
            );

            return back()->with('success', 'Serviço marcado como entregue!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Complete an order (client confirms delivery).
     */
    public function complete(Request $request, Order $order): RedirectResponse
    {
        try {
            $this->orderService->completeOrder($order, $request->user());

            return back()->with('success', 'Pedido concluído com sucesso! Pode agora deixar uma avaliação.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Cancel an order.
     */
    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->orderService->cancelOrder($order, $request->user(), $validated['reason']);

            return back()->with('success', 'Pedido cancelado.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Open a dispute.
     */
    public function dispute(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $this->orderService->disputeOrder($order, $request->user(), $validated['reason']);

            return back()->with('success', 'Disputa aberta. A nossa equipa irá analisar o caso.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Create order directly from service page (quick hire).
     */
    public function createFromService(Request $request, Service $service): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'requirements' => 'nullable|string|max:2000',
            'is_urgent' => 'nullable|boolean',
            'payment_method' => 'nullable|in:wallet',
        ]);

        // Can't order own service
        if ($service->serviceProvider->user_id === $user->id) {
            return back()->withErrors(['service' => 'Não pode encomendar o seu próprio serviço.']);
        }

        try {
            $order = $this->orderService->createOrder(
                $service,
                $user,
                null, // No conversation
                $service->price_min, // Use minimum price as agreed price
                $validated['requirements'] ?? null,
                $validated['payment_method'] ?? 'wallet',
                (bool) ($validated['is_urgent'] ?? false)
            );

            return back()->with('success', 'Pedido criado com sucesso!');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Get pending orders count for provider.
     */
    public function pendingCount(Request $request)
    {
        $user = $request->user();

        if (!$user->isProvider()) {
            return response()->json(['count' => 0]);
        }

        $provider = $user->serviceProvider;

        if (!$provider) {
            return response()->json(['count' => 0]);
        }

        $count = Order::where('provider_id', $provider->id)
            ->where('status', OrderStatus::PENDING)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Start timer for an order (provider action).
     */
    public function startTimer(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can start timer
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        try {
            $result = $this->timeTrackingService->startTimer($order, $user);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Pause timer for an order (provider action).
     */
    public function pauseTimer(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can pause timer
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->timeTrackingService->pauseTimer(
                $order,
                $user,
                $validated['reason'] ?? null
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Resume timer for an order (provider action).
     */
    public function resumeTimer(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can resume timer
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        try {
            $result = $this->timeTrackingService->resumeTimer($order, $user);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Stop timer for an order (provider action).
     */
    public function stopTimer(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only provider can stop timer
        if ($order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $result = $this->timeTrackingService->stopTimer(
                $order,
                $user,
                $validated['notes'] ?? null
            );
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get timer status for an order.
     */
    public function timerStatus(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only client or provider can check status
        if ($order->client_id !== $user->id &&
            $order->provider->user_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        try {
            $status = $this->timeTrackingService->getTimerStatus($order);
            return response()->json($status);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Dispute timer (client action).
     */
    public function disputeTimer(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only client can dispute timer
        if ($order->client_id !== $user->id) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:1000',
            'disputed_seconds' => 'required|integer|min:0',
        ]);

        try {
            $this->timeTrackingService->disputeTimer(
                $order,
                $user,
                $validated['reason'],
                $validated['disputed_seconds']
            );
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get timer breakdown for an order.
     */
    public function timerBreakdown(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        // Authorization: only client or provider can see breakdown
        if ($order->client_id !== $user->id &&
            $order->provider->user_id !== $user->id &&
            !$user->isAdmin()) {
            return response()->json(['error' => 'Não autorizado'], 403);
        }

        try {
            $breakdown = $this->timeTrackingService->getTimerBreakdown($order);
            return response()->json($breakdown);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
}
