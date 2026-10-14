<?php

namespace App\Filament\Resources\KycVerificationResource\Pages;

use App\Filament\Resources\KycVerificationResource;
use App\Enums\KycStatus;
use App\Services\KycService;
use Filament\Actions;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ViewRecord;

class ViewKycVerification extends ViewRecord
{
    protected static string $resource = KycVerificationResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\Action::make('approve')
                ->label('Aprovar')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->requiresConfirmation()
                ->modalHeading('Aprovar Verificação KYC')
                ->modalDescription('Tem certeza que deseja aprovar esta verificação? O prestador poderá publicar serviços.')
                ->visible(fn () => in_array($this->record->status, [KycStatus::PENDING, KycStatus::RESUBMIT]))
                ->action(function () {
                    $service = app(KycService::class);
                    $service->approve($this->record, auth()->user());

                    Notification::make()
                        ->title('Verificação aprovada com sucesso')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status', 'reviewed_by', 'reviewed_at']);
                }),

            Actions\Action::make('reject')
                ->label('Reprovar')
                ->icon('heroicon-o-x-circle')
                ->color('danger')
                ->form([
                    Forms\Components\Textarea::make('reason')
                        ->label('Motivo da Rejeição')
                        ->required()
                        ->minLength(10)
                        ->placeholder('Explique o motivo da rejeição...'),
                ])
                ->visible(fn () => in_array($this->record->status, [KycStatus::PENDING, KycStatus::RESUBMIT]))
                ->action(function (array $data) {
                    $service = app(KycService::class);
                    $service->reject($this->record, auth()->user(), $data['reason']);

                    Notification::make()
                        ->title('Verificação reprovada')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status', 'reviewed_by', 'reviewed_at', 'rejection_reason']);
                }),

            Actions\Action::make('request_resubmit')
                ->label('Pedir Reenvio')
                ->icon('heroicon-o-arrow-path')
                ->color('info')
                ->form([
                    Forms\Components\Textarea::make('reason')
                        ->label('Motivo do Pedido')
                        ->required()
                        ->minLength(10)
                        ->placeholder('Explique o que precisa ser corrigido...'),
                ])
                ->visible(fn () => $this->record->status === KycStatus::PENDING)
                ->action(function (array $data) {
                    $service = app(KycService::class);
                    $service->requestResubmit($this->record, auth()->user(), $data['reason']);

                    Notification::make()
                        ->title('Pedido de reenvio enviado')
                        ->success()
                        ->send();

                    $this->refreshFormData(['status', 'reviewed_by', 'reviewed_at', 'rejection_reason']);
                }),
        ];
    }
}
