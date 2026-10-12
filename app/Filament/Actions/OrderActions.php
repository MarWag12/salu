<?php

namespace App\Filament\Actions;

use App\Models\AuditLog;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Support\Realtime;
use Filament\Forms;
use Filament\Notifications\Notification;

/**
 * Acções de administração sobre pedidos, partilhadas pela tabela e pela página de detalhe.
 * $actionClass = \Filament\Tables\Actions\Action::class  ou  \Filament\Actions\Action::class
 */
final class OrderActions
{
    public static function assign(string $actionClass)
    {
        return $actionClass::make('assign')
            ->label(fn (ServiceRequest $record) => $record->technician_id ? 'Reatribuir' : 'Atribuir técnico')
            ->icon('heroicon-o-user-plus')->color('primary')
            ->visible(fn (ServiceRequest $record) => in_array($record->status, [ServiceRequest::PENDENTE, ServiceRequest::ATRIBUIDO], true))
            ->modalHeading('Atribuir técnico')
            ->form([
                Forms\Components\Select::make('technician_id')->label('Técnico')->required()->searchable()
                    ->options(fn (ServiceRequest $record) => Technician::approved()->where('available', true)
                        ->whereHas('categories', fn ($c) => $c->where('categories.id', $record->service->category_id))
                        ->with('user')->get()->mapWithKeys(fn ($t) => [$t->id => $t->user->name.' — '.($t->municipality ?: 's/ município')]))
                    ->helperText('Apenas técnicos aprovados e disponíveis na categoria deste serviço.'),
            ])
            ->action(function (ServiceRequest $record, array $data) {
                $tech = Technician::approved()->with('user')->findOrFail($data['technician_id']);
                $record->update(['technician_id' => $tech->id, 'status' => ServiceRequest::ATRIBUIDO]);
                AuditLog::record('pedido_atribuido', "Pedido {$record->code} atribuído a {$tech->user->name}");
                Realtime::order($record, 'Técnico atribuído', "O pedido {$record->code} foi atribuído a {$tech->user->name}.", Realtime::parties($record->refresh()));
                Notification::make()->success()->title("Pedido atribuído a {$tech->user->name}.")->send();
            });
    }

    public static function cancel(string $actionClass)
    {
        return $actionClass::make('cancel_order')
            ->label('Cancelar pedido')->icon('heroicon-o-x-mark')->color('danger')
            ->visible(fn (ServiceRequest $record) => ! in_array($record->status, [ServiceRequest::CONCLUIDO, ServiceRequest::CANCELADO], true))
            ->modalHeading('Cancelar pedido')
            ->form([Forms\Components\TextInput::make('cancel_reason')->label('Motivo (opcional)')->maxLength(255)])
            ->action(function (ServiceRequest $record, array $data) {
                $record->update(['status' => ServiceRequest::CANCELADO, 'cancel_reason' => $data['cancel_reason'] ?? null]);
                AuditLog::record('pedido_cancelado', "Pedido {$record->code} cancelado pelo administrador");
                Realtime::order($record, 'Pedido cancelado', "O pedido {$record->code} foi cancelado pela Salu.", Realtime::parties($record));
                Notification::make()->success()->title('Pedido cancelado.')->send();
            });
    }
}
