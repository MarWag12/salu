<?php

namespace App\Filament\Widgets;

use App\Models\Payment;
use App\Support\Format;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class FinanceStats extends StatsOverviewWidget
{
    protected static ?int $sort = 2;

    protected function getStats(): array
    {
        $confirmed = Payment::where('status', Payment::CONFIRMADO);

        return [
            Stat::make('Receita total', Format::aoa((clone $confirmed)->sum('amount')))
                ->description('Pagamentos confirmados')->descriptionIcon('heroicon-m-banknotes')->color('success'),
            Stat::make('Receita do mês', Format::aoa((clone $confirmed)->whereYear('confirmed_at', now()->year)->whereMonth('confirmed_at', now()->month)->sum('amount')))
                ->description(ucfirst(now()->translatedFormat('F Y')))->descriptionIcon('heroicon-m-calendar')->color('primary'),
            Stat::make('Pagamentos pendentes', Payment::where('status', Payment::PENDENTE)->count())
                ->description('A aguardar confirmação')->descriptionIcon('heroicon-m-clock')->color('warning'),
        ];
    }
}
