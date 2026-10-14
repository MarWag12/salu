<?php

namespace App\Filament\Resources\PayoutResource\Pages;

use App\Filament\Resources\PayoutResource;
use App\Models\Payout;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use Illuminate\Database\Eloquent\Builder;

class ListPayouts extends ListRecords
{
    protected static string $resource = PayoutResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Todos')
                ->badge(Payout::count()),

            'pending' => Tab::make('Pendentes')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Payout::STATUS_PENDING))
                ->badge(Payout::where('status', Payout::STATUS_PENDING)->count())
                ->badgeColor('warning'),

            'processing' => Tab::make('Em Processamento')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Payout::STATUS_PROCESSING))
                ->badge(Payout::where('status', Payout::STATUS_PROCESSING)->count())
                ->badgeColor('info'),

            'completed' => Tab::make('Concluídos')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Payout::STATUS_COMPLETED))
                ->badge(Payout::where('status', Payout::STATUS_COMPLETED)->count())
                ->badgeColor('success'),

            'failed' => Tab::make('Falhou')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Payout::STATUS_FAILED))
                ->badge(Payout::where('status', Payout::STATUS_FAILED)->count())
                ->badgeColor('danger'),
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            PayoutResource\Widgets\PayoutStatsWidget::class,
        ];
    }
}
