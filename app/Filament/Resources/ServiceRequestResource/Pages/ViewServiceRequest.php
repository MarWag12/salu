<?php

namespace App\Filament\Resources\ServiceRequestResource\Pages;

use App\Filament\Resources\ServiceRequestResource;
use App\Filament\Actions\OrderActions;
use Filament\Resources\Pages\ViewRecord;

class ViewServiceRequest extends ViewRecord
{
    protected static string $resource = ServiceRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [OrderActions::assign(\Filament\Actions\Action::class), OrderActions::cancel(\Filament\Actions\Action::class)];
    }
}
