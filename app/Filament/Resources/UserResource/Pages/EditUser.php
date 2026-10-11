<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use App\Models\AuditLog;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    /** Um administrador não pode retirar o próprio papel nem desactivar a própria conta. */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        if ($this->record->id === auth()->id()) {
            $data['role'] = 'admin';
            $data['active'] = true;
        }

        return $data;
    }

    protected function afterSave(): void
    {
        AuditLog::record('utilizador_actualizado', $this->record->name);
    }
}
