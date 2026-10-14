<?php

namespace App\Filament\Resources\DisputeResource\Pages;

use App\Filament\Resources\DisputeResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use Illuminate\Database\Eloquent\Builder;
use App\Models\Dispute;

class ListDisputes extends ListRecords
{
    protected static string $resource = DisputeResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Todas')
                ->badge(Dispute::count()),

            'pending' => Tab::make('Pendentes')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Dispute::STATUS_PENDING))
                ->badge(Dispute::where('status', Dispute::STATUS_PENDING)->count())
                ->badgeColor('warning'),

            'under_review' => Tab::make('Em Análise')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', Dispute::STATUS_UNDER_REVIEW))
                ->badge(Dispute::where('status', Dispute::STATUS_UNDER_REVIEW)->count())
                ->badgeColor('info'),

            'resolved' => Tab::make('Resolvidas')
                ->modifyQueryUsing(fn (Builder $query) => $query->whereIn('status', [
                    Dispute::STATUS_RESOLVED_CLIENT,
                    Dispute::STATUS_RESOLVED_PROVIDER,
                ]))
                ->badge(Dispute::whereIn('status', [
                    Dispute::STATUS_RESOLVED_CLIENT,
                    Dispute::STATUS_RESOLVED_PROVIDER,
                ])->count())
                ->badgeColor('success'),
        ];
    }
}
