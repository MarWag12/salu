<?php

namespace App\Http\Controllers\Provider;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EarningsController extends Controller
{
    /**
     * Display earnings history.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Não é um prestador de serviços.');
        }

        // Get filters
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $period = $request->input('period', 'all'); // all, today, week, month, year

        // Build query
        $query = Order::where('provider_id', $provider->id)
            ->where('status', 'completed')
            ->with(['service', 'client']);

        // Apply date filters
        if ($startDate && $endDate) {
            $query->whereBetween('completed_at', [$startDate, $endDate . ' 23:59:59']);
        } elseif ($period !== 'all') {
            switch ($period) {
                case 'today':
                    $query->whereDate('completed_at', today());
                    break;
                case 'week':
                    $query->whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereBetween('completed_at', [now()->startOfMonth(), now()->endOfMonth()]);
                    break;
                case 'year':
                    $query->whereBetween('completed_at', [now()->startOfYear(), now()->endOfYear()]);
                    break;
            }
        }

        // Get orders with pagination
        $orders = $query->latest('completed_at')
            ->paginate(20)
            ->withQueryString();

        // Get statistics
        $statsQuery = Order::where('provider_id', $provider->id)
            ->where('status', 'completed');

        if ($startDate && $endDate) {
            $statsQuery->whereBetween('completed_at', [$startDate, $endDate . ' 23:59:59']);
        } elseif ($period !== 'all') {
            switch ($period) {
                case 'today':
                    $statsQuery->whereDate('completed_at', today());
                    break;
                case 'week':
                    $statsQuery->whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $statsQuery->whereBetween('completed_at', [now()->startOfMonth(), now()->endOfMonth()]);
                    break;
                case 'year':
                    $statsQuery->whereBetween('completed_at', [now()->startOfYear(), now()->endOfYear()]);
                    break;
            }
        }

        $stats = [
            'total_earnings' => (float) ($statsQuery->clone()->sum('agreed_price')),
            'total_orders' => $statsQuery->clone()->count(),
            'average_order_value' => (float) ($statsQuery->clone()->avg('agreed_price') ?? 0),
        ];

        // Monthly earnings chart data (last 12 months)
        $monthlyEarnings = Order::where('provider_id', $provider->id)
            ->where('status', 'completed')
            ->where('completed_at', '>=', now()->subYear())
            ->get(['agreed_price', 'completed_at'])
            ->groupBy(fn ($order) => $order->completed_at->format('Y/m'))
            ->map(fn ($group, $month) => [
                'month' => $month,
                'total' => (float) ($group->sum('agreed_price')),
                'orders' => $group->count(),
            ])
            ->sortKeys()
            ->values();

        // All time stats
        $allTimeStats = [
            'total_earnings' => (float) (Order::where('provider_id', $provider->id)->where('status', 'completed')->sum('agreed_price')),
            'total_orders' => Order::where('provider_id', $provider->id)->where('status', 'completed')->count(),
        ];

        // Pending earnings (delivered but not yet confirmed by client)
        $pendingEarnings = [
            'total' => (float) (Order::where('provider_id', $provider->id)->where('status', 'delivered')->sum('agreed_price')),
            'count' => Order::where('provider_id', $provider->id)->where('status', 'delivered')->count(),
        ];

        return Inertia::render('Provider/Earnings', [
            'orders' => $orders,
            'stats' => $stats,
            'allTimeStats' => $allTimeStats,
            'pendingEarnings' => $pendingEarnings,
            'monthlyEarnings' => $monthlyEarnings,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'period' => $period,
            ],
        ]);
    }

    /**
     * Export earnings report as PDF.
     */
    public function exportPdf(Request $request): StreamedResponse
    {
        $user = $request->user();
        $provider = $user->serviceProvider;

        if (!$provider) {
            abort(403, 'Não é um prestador de serviços.');
        }

        // Get filters
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $period = $request->input('period', 'all');

        // Build query
        $query = Order::where('provider_id', $provider->id)
            ->where('status', 'completed')
            ->with(['service', 'client']);

        // Apply date filters
        if ($startDate && $endDate) {
            $query->whereBetween('completed_at', [$startDate, $endDate . ' 23:59:59']);
        } elseif ($period !== 'all') {
            switch ($period) {
                case 'today':
                    $query->whereDate('completed_at', today());
                    break;
                case 'week':
                    $query->whereBetween('completed_at', [now()->startOfWeek(), now()->endOfWeek()]);
                    break;
                case 'month':
                    $query->whereBetween('completed_at', [now()->startOfMonth(), now()->endOfMonth()]);
                    break;
                case 'year':
                    $query->whereBetween('completed_at', [now()->startOfYear(), now()->endOfYear()]);
                    break;
            }
        }

        $orders = $query->latest('completed_at')->get();

        $totalEarnings = $orders->sum('agreed_price');
        $totalOrders = $orders->count();

        // Build period label
        $periodLabel = match($period) {
            'today' => 'Hoje',
            'week' => 'Esta Semana',
            'month' => 'Este Mês',
            'year' => 'Este Ano',
            default => $startDate && $endDate ? "$startDate a $endDate" : 'Todos os tempos',
        };

        $html = view('pdf.earnings-report', [
            'provider' => $provider,
            'orders' => $orders,
            'totalEarnings' => $totalEarnings,
            'totalOrders' => $totalOrders,
            'periodLabel' => $periodLabel,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ])->render();

        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'relatorio-ganhos-' . now()->format('Y-m-d') . '.pdf';

        return response()->streamDownload(
            fn () => print($pdf->output()),
            $filename,
            ['Content-Type' => 'application/pdf']
        );
    }
}
