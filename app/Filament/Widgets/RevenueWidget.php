<?php

namespace App\Filament\Widgets;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Number;

class RevenueWidget extends BaseWidget
{
    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        $totalRevenue = Payment::where('status', PaymentStatus::COMPLETED)->sum('amount');
        $monthRevenue = Payment::where('status', PaymentStatus::COMPLETED)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('amount');
        $pendingPayments = Payment::where('status', PaymentStatus::PENDING)->count();

        return [
            Stat::make('Receita Total', 'AOA ' . number_format($totalRevenue, 2, ',', '.'))
                ->description('Pagamentos confirmados')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),

            Stat::make('Receita do Mês', 'AOA ' . number_format($monthRevenue, 2, ',', '.'))
                ->description(now()->format('F Y'))
                ->descriptionIcon('heroicon-m-calendar')
                ->color('info'),

            Stat::make('Pagamentos Pendentes', $pendingPayments)
                ->description('A aguardar confirmação')
                ->descriptionIcon('heroicon-m-clock')
                ->color('warning'),
        ];
    }
}
