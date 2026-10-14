<?php

namespace App\Filament\Resources\KycVerificationResource\Pages;

use App\Filament\Resources\KycVerificationResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Resources\Components\Tab;
use App\Enums\KycStatus;
use Illuminate\Database\Eloquent\Builder;

class ListKycVerifications extends ListRecords
{
    protected static string $resource = KycVerificationResource::class;

    protected function getHeaderActions(): array
    {
        return [];
    }

    public function getTabs(): array
    {
        return [
            'pending' => Tab::make('Pendentes')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', KycStatus::PENDING))
                ->badge(fn () => static::getModel()::where('status', KycStatus::PENDING)->count())
                ->badgeColor('warning'),

            'resubmit' => Tab::make('Reenviar')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', KycStatus::RESUBMIT))
                ->badge(fn () => static::getModel()::where('status', KycStatus::RESUBMIT)->count() ?: null)
                ->badgeColor('info'),

            'approved' => Tab::make('Aprovados')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', KycStatus::APPROVED)),

            'rejected' => Tab::make('Reprovados')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('status', KycStatus::REJECTED)),

            'all' => Tab::make('Todos'),
        ];
    }

    public function getDefaultActiveTab(): string
    {
        return 'pending';
    }
}
