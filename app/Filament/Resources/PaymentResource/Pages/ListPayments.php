<?php

namespace App\Filament\Resources\PaymentResource\Pages;

use App\Enums\PaymentStatus;
use App\Filament\Resources\PaymentResource;
use App\Models\Payment;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListPayments extends ListRecords
{
    protected static string $resource = PaymentResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'all' => Tab::make('Todos'),

            'completed' => Tab::make('Concluídos')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', PaymentStatus::COMPLETED))
                ->badge(fn () => Payment::where('status', PaymentStatus::COMPLETED)->count() ?: null)
                ->badgeColor('success'),

            'pending' => Tab::make('Pendentes')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', PaymentStatus::PENDING))
                ->badge(fn () => Payment::where('status', PaymentStatus::PENDING)->count() ?: null)
                ->badgeColor('warning'),

            'failed' => Tab::make('Falhados')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', PaymentStatus::FAILED)),

            'refunded' => Tab::make('Reembolsados')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', PaymentStatus::REFUNDED)),
        ];
    }
}
