<?php

namespace App\Filament\Resources\ServiceResource\Pages;

use App\Enums\ServiceStatus;
use App\Filament\Resources\ServiceResource;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListServices extends ListRecords
{
    protected static string $resource = ServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'pending' => Tab::make('Pendentes')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', ServiceStatus::PENDING))
                ->badge(fn () => static::getModel()::where('status', ServiceStatus::PENDING)->count())
                ->badgeColor('warning'),

            'published' => Tab::make('Publicados')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', ServiceStatus::PUBLISHED)),

            'featured' => Tab::make('Destaque')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', ServiceStatus::FEATURED)
                    ->where('highlight_expires_at', '>', now()))
                ->badge(fn () => static::getModel()::where('status', ServiceStatus::FEATURED)
                    ->where('highlight_expires_at', '>', now())->count() ?: null)
                ->badgeColor('info'),

            'suspended' => Tab::make('Suspensos')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', ServiceStatus::SUSPENDED)),

            'all' => Tab::make('Todos'),
        ];
    }

    public function getDefaultActiveTab(): string
    {
        return 'pending';
    }
}
