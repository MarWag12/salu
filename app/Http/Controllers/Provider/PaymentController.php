<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use App\Models\HighlightPlan;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {}

    /**
     * Show highlight plans for a service.
     */
    public function plans(Service $service)
    {
        $this->authorize('highlight', $service);

        $plans = $this->paymentService->getAvailablePlans();

        return Inertia::render('Provider/Services/Highlight', [
            'service' => $service->load(['category', 'media']),
            'plans' => $plans,
        ]);
    }

    /**
     * Initiate checkout for a highlight plan.
     */
    public function checkout(Request $request, Service $service)
    {
        $this->authorize('highlight', $service);

        $request->validate([
            'plan_id' => 'required|exists:highlight_plans,id',
            'gateway' => 'nullable|string|in:simulated,stripe',
        ]);

        $plan = HighlightPlan::findOrFail($request->plan_id);
        $gateway = $request->gateway ?? config('services.payments.default', 'simulated');

        $result = $this->paymentService->initiateHighlightPayment(
            $service,
            $plan,
            $gateway
        );

        return redirect()->away($result['checkout_url']);
    }

    /**
     * Handle successful payment return.
     */
    public function success(Payment $payment)
    {
        abort_unless($payment->serviceProvider?->user_id === auth()->id() || $payment->user_id === auth()->id(), 403);
        $service = $payment->service;

        // If still pending, wait for webhook
        if ($payment->isPending()) {
            return Inertia::render('Provider/Payments/Processing', [
                'payment' => $payment,
                'service' => $service,
            ]);
        }

        return redirect()->route('provider.services.index')
            ->with('success', 'O seu serviço está agora em destaque!');
    }

    /**
     * Handle cancelled payment return.
     */
    public function cancel(Payment $payment)
    {
        abort_unless($payment->serviceProvider?->user_id === auth()->id() || $payment->user_id === auth()->id(), 403);
        return redirect()->route('provider.services.index')
            ->with('info', 'O pagamento foi cancelado.');
    }

    /**
     * Show payment history.
     */
    public function history()
    {
        $provider = auth()->user()->serviceProvider;

        // Highlight payments
        $highlightPayments = Payment::where('service_provider_id', $provider->id)
            ->with(['service', 'highlightPlan'])
            ->orderBy('created_at', 'desc')
            ->paginate(10, ['*'], 'highlight_page');

        // Service earnings (completed orders)
        $completedOrders = Order::where('provider_id', $provider->id)
            ->whereIn('status', ['completed', 'delivered'])
            ->with(['service', 'client'])
            ->orderBy('completed_at', 'desc')
            ->orderBy('delivered_at', 'desc')
            ->paginate(10, ['*'], 'earnings_page');

        // Earnings summary
        $earningsSummary = [
            'total_completed' => (float) (Order::where('provider_id', $provider->id)
                ->where('status', 'completed')
                ->sum('agreed_price')),
            'total_pending' => (float) (Order::where('provider_id', $provider->id)
                ->where('status', 'delivered')
                ->sum('agreed_price')),
            'completed_count' => Order::where('provider_id', $provider->id)
                ->where('status', 'completed')
                ->count(),
            'pending_count' => Order::where('provider_id', $provider->id)
                ->where('status', 'delivered')
                ->count(),
        ];

        return Inertia::render('Provider/Payments/History', [
            'payments' => $highlightPayments,
            'completedOrders' => $completedOrders,
            'earningsSummary' => $earningsSummary,
        ]);
    }
}
