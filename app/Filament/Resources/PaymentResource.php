<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaymentResource\Pages;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Support\Format;
use App\Support\Realtime;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationGroup = 'Financeiro';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'pagamento';

    protected static ?string $pluralModelLabel = 'pagamentos';

    public static function getNavigationBadge(): ?string
    {
        $n = Payment::where('status', Payment::PENDENTE)->count();

        return $n ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): string|array|null
    {
        return 'warning';
    }

    public static function canCreate(): bool
    {
        return false; // O cliente regista o pagamento; a CAFPMIF confirma-o.
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['serviceRequest.client', 'serviceRequest.service']))
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('serviceRequest.code')->label('Pedido')->searchable()->weight('bold')
                    ->url(fn (Payment $record) => ServiceRequestResource::getUrl('view', ['record' => $record->service_request_id])),
                Tables\Columns\TextColumn::make('serviceRequest.client.name')->label('Cliente'),
                Tables\Columns\TextColumn::make('serviceRequest.service.name')->label('Serviço')->limit(30),
                Tables\Columns\TextColumn::make('method')->label('Método')->formatStateUsing(fn (string $state) => Payment::METHODS[$state] ?? $state),
                Tables\Columns\TextColumn::make('reference')->label('Referência')->placeholder('—')->searchable(),
                Tables\Columns\TextColumn::make('amount')->label('Valor')->sortable()->formatStateUsing(fn ($state) => Format::aoa($state)),
                Tables\Columns\TextColumn::make('status')->label('Estado')->badge()
                    ->formatStateUsing(fn (string $state) => $state === Payment::CONFIRMADO ? 'Confirmado' : 'Pendente')
                    ->color(fn (string $state) => $state === Payment::CONFIRMADO ? 'success' : 'warning'),
                Tables\Columns\TextColumn::make('created_at')->label('Registado')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->label('Estado')
                    ->options([Payment::PENDENTE => 'Pendente', Payment::CONFIRMADO => 'Confirmado']),
            ])
            ->actions([
                Tables\Actions\Action::make('confirm')->label('Confirmar')->icon('heroicon-o-check-circle')->color('success')
                    ->requiresConfirmation()->modalHeading('Confirmar pagamento')
                    ->visible(fn (Payment $record) => $record->status === Payment::PENDENTE)
                    ->action(function (Payment $record) {
                        $record->update(['status' => Payment::CONFIRMADO, 'confirmed_at' => now()]);
                        AuditLog::record('pagamento_confirmado', "Pagamento do pedido {$record->serviceRequest->code} confirmado (".Format::aoa($record->amount).')');
                        Realtime::order($record->serviceRequest, 'Pagamento confirmado', "O pagamento do pedido {$record->serviceRequest->code} foi confirmado.", Realtime::parties($record->serviceRequest));
                        Notification::make()->success()->title('Pagamento confirmado.')->send();
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return ['index' => Pages\ListPayments::route('/')];
    }
}
