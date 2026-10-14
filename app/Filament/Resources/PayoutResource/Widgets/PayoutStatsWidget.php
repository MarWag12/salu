<?php

namespace App\Filament\Resources\PayoutResource\Widgets;

use App\Models\Payout;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PayoutStatsWidget extends BaseWidget
{
    protected function getStats(): array
    {
        $pendingTotal = Payout::where('status', Payout::STATUS_PENDING)->sum('net_amount');
        $processingTotal = Payout::where('status', Payout::STATUS_PROCESSING)->sum('net_amount');
        $completedTotal = Payout::where('status', Payout::STATUS_COMPLETED)->sum('net_amount');
        $completedThisMonth = Payout::where('status', Payout::STATUS_COMPLETED)
            ->whereMonth('completed_at', now()->month)
            ->whereYear('completed_at', now()->year)
            ->sum('net_amount');

        return [
            Stat::make('Pendentes', number_format($pendingTotal, 0, ',', '.') . ' AOA')
                ->description(Payout::where('status', Payout::STATUS_PENDING)->count() . ' pedidos')
                ->color('warning')
                ->icon('heroicon-o-clock'),

            Stat::make('Em Processamento', number_format($processingTotal, 0, ',', '.') . ' AOA')
                ->description(Payout::where('status', Payout::STATUS_PROCESSING)->count() . ' pedidos')
                ->color('info')
                ->icon('heroicon-o-arrow-path'),

            Stat::make('Total Pago (Sempre)', number_format($completedTotal, 0, ',', '.') . ' AOA')
                ->description(Payout::where('status', Payout::STATUS_COMPLETED)->count() . ' pagamentos')
                ->color('success')
                ->icon('heroicon-o-check-circle'),

            Stat::make('Pago Este Mês', number_format($completedThisMonth, 0, ',', '.') . ' AOA')
                ->description(now()->format('F Y'))
                ->color('primary')
                ->icon('heroicon-o-calendar'),
        ];
    }
}
