<?php

namespace App\Filament\Resources\TechnicianResource\Pages;

use App\Filament\Resources\TechnicianResource;
use App\Models\Technician;
use Filament\Resources\Components\Tab;
use Filament\Resources\Pages\ListRecords;
use Illuminate\Database\Eloquent\Builder;

class ListTechnicians extends ListRecords
{
    protected static string $resource = TechnicianResource::class;

    public function getTabs(): array
    {
        $count = fn (string $status) => Technician::where('kyc_status', $status)->count();

        return [
            'pendente' => Tab::make('KYC pendente')->icon('heroicon-o-clock')
                ->badge($count(Technician::KYC_PENDENTE))->badgeColor('warning')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('kyc_status', Technician::KYC_PENDENTE)),
            'aprovado' => Tab::make('Aprovados')->icon('heroicon-o-check-circle')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('kyc_status', Technician::KYC_APROVADO)),
            'rejeitado' => Tab::make('Rejeitados')->icon('heroicon-o-x-circle')
                ->modifyQueryUsing(fn (Builder $query) => $query->where('kyc_status', Technician::KYC_REJEITADO)),
            'todos' => Tab::make('Todos'),
        ];
    }

    public function getDefaultActiveTab(): string|int|null
    {
        return 'pendente';
    }
}
