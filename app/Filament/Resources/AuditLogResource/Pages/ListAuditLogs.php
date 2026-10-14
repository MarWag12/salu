<?php

namespace App\Filament\Resources\AuditLogResource\Pages;

use App\Filament\Resources\AuditLogResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use Illuminate\Database\Eloquent\Builder;
use App\Models\AuditLog;

class ListAuditLogs extends ListRecords
{
    protected static string $resource = AuditLogResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Todos')
                ->badge(AuditLog::count()),

            'orders' => Tab::make('Pedidos')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('auditable_type', 'App\\Models\\Order'))
                ->badge(AuditLog::where('auditable_type', 'App\\Models\\Order')->count())
                ->badgeColor('primary'),

            'payouts' => Tab::make('Levantamentos')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('auditable_type', 'App\\Models\\Payout'))
                ->badge(AuditLog::where('auditable_type', 'App\\Models\\Payout')->count())
                ->badgeColor('success'),

            'disputes' => Tab::make('Disputas')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('auditable_type', 'App\\Models\\Dispute'))
                ->badge(AuditLog::where('auditable_type', 'App\\Models\\Dispute')->count())
                ->badgeColor('danger'),

            'kyc' => Tab::make('Verificações KYC')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('auditable_type', 'App\\Models\\KycVerification'))
                ->badge(AuditLog::where('auditable_type', 'App\\Models\\KycVerification')->count())
                ->badgeColor('info'),
        ];
    }
}
