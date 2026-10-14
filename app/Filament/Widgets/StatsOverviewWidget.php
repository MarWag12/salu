<?php

namespace App\Filament\Widgets;

use App\Enums\KycStatus;
use App\Enums\PaymentStatus;
use App\Enums\ServiceStatus;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class StatsOverviewWidget extends BaseWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        return [
            Stat::make('Total de Utilizadores', User::count())
                ->description('Utilizadores registados')
                ->descriptionIcon('heroicon-m-users')
                ->color('primary'),

            Stat::make('Prestadores Activos', ServiceProvider::where('is_verified', true)->count())
                ->description('Com KYC aprovado')
                ->descriptionIcon('heroicon-m-check-badge')
                ->color('success'),

            Stat::make('Serviços Publicados', Service::where('status', ServiceStatus::PUBLISHED)->count())
                ->description('Visíveis na plataforma')
                ->descriptionIcon('heroicon-m-briefcase')
                ->color('info'),

            Stat::make('Serviços em Destaque', Service::where('status', ServiceStatus::FEATURED)
                ->where('highlight_expires_at', '>', now())
                ->count())
                ->description('Actualmente destacados')
                ->descriptionIcon('heroicon-m-star')
                ->color('warning'),
        ];
    }
}
