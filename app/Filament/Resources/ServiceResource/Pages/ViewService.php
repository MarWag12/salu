<?php

namespace App\Filament\Resources\ServiceResource\Pages;

use App\Enums\ServiceStatus;
use App\Filament\Resources\ServiceResource;
use App\Services\ServiceService;
use Filament\Actions;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewService extends ViewRecord
{
    protected static string $resource = ServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('approve')
                ->label('Aprovar')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->modalHeading('Aprovar Serviço')
                ->modalDescription('Tem certeza que deseja aprovar este serviço? Ele será publicado.')
                ->visible(fn () => $this->record->status === ServiceStatus::PENDING)
                ->action(function () {
                    $service = app(ServiceService::class);
                    $service->approve($this->record);

                    Notification::make()
                        ->title('Serviço aprovado com sucesso')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status']);
                }),

            Actions\Action::make('suspend')
                ->label('Suspender')
                ->icon('heroicon-o-pause-circle')
                ->color('danger')
                ->requiresConfirmation()
                ->modalHeading('Suspender Serviço')
                ->modalDescription('Tem certeza que deseja suspender este serviço? Ele não será mais visível.')
                ->visible(fn () => in_array($this->record->status, [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED]))
                ->action(function () {
                    $service = app(ServiceService::class);
                    $service->suspend($this->record);

                    Notification::make()
                        ->title('Serviço suspenso')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status']);
                }),

            Actions\Action::make('reactivate')
                ->label('Reactivar')
                ->icon('heroicon-o-play-circle')
                ->color('success')
                ->requiresConfirmation()
                ->modalHeading('Reactivar Serviço')
                ->modalDescription('Tem certeza que deseja reactivar este serviço?')
                ->visible(fn () => $this->record->status === ServiceStatus::SUSPENDED)
                ->action(function () {
                    $service = app(ServiceService::class);
                    $service->approve($this->record);

                    Notification::make()
                        ->title('Serviço reactivado')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status']);
                }),

            Actions\DeleteAction::make()
                ->requiresConfirmation()
                ->modalDescription('Esta acção é irreversível. O serviço e todas as imagens serão eliminados.'),
        ];
    }
}
