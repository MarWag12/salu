<?php

namespace App\Filament\Resources\WalletTopUpRequestResource\Pages;

use App\Filament\Resources\WalletTopUpRequestResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListWalletTopUpRequests extends ListRecords
{
    protected static string $resource = WalletTopUpRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}
