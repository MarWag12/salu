<?php

namespace App\Filament\Resources\WalletTopUpRequestResource\Pages;

use App\Filament\Resources\WalletTopUpRequestResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditWalletTopUpRequest extends EditRecord
{
    protected static string $resource = WalletTopUpRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
