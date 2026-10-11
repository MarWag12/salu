<?php

namespace App\Filament\Widgets;

use App\Models\Dispute;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class OperationsStats extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getColumns(): int
    {
        return 4;
    }

    protected function getStats(): array
    {
        return [
            Stat::make('Total de utilizadores', User::count())
                ->description('Utilizadores registados')->descriptionIcon('heroicon-m-users')->color('warning'),
            Stat::make('Técnicos activos', Technician::approved()->count())
                ->description('Com KYC aprovado')->descriptionIcon('heroicon-m-check-circle')->color('success'),
            Stat::make('Serviços publicados', Service::active()->count())
                ->description('Visíveis na plataforma')->descriptionIcon('heroicon-m-briefcase')->color('primary'),
            Stat::make('Serviços em destaque', Service::active()->where('featured', true)->count())
                ->description('Actualmente destacados')->descriptionIcon('heroicon-m-star')->color('warning'),
            Stat::make('Pedidos por atribuir', ServiceRequest::where('status', ServiceRequest::PENDENTE)->count())
                ->description('A aguardar técnico')->descriptionIcon('heroicon-m-clock')->color('warning'),
            Stat::make('Pedidos em execução', ServiceRequest::whereIn('status', [ServiceRequest::ATRIBUIDO, ServiceRequest::EM_CURSO])->count())
                ->description('Atribuídos ou em curso')->descriptionIcon('heroicon-m-wrench-screwdriver')->color('primary'),
            Stat::make('Disputas abertas', Dispute::where('status', 'aberta')->count())
                ->description('Requerem atenção')->descriptionIcon('heroicon-m-exclamation-triangle')->color('danger'),
        ];
    }
}
