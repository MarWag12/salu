<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DisputeResource\Pages;
use App\Models\Dispute;
use App\Models\Order;
use App\Enums\OrderStatus;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class DisputeResource extends Resource
{
    protected static ?string $model = Dispute::class;

    protected static ?string $navigationIcon = 'heroicon-o-exclamation-triangle';

    protected static ?string $navigationLabel = 'Disputas';

    protected static ?string $modelLabel = 'Disputa';

    protected static ?string $pluralModelLabel = 'Disputas';

    protected static ?string $navigationGroup = 'Gestão de Pedidos';

    protected static ?int $navigationSort = 2;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::whereIn('status', [
            Dispute::STATUS_PENDING,
            Dispute::STATUS_UNDER_REVIEW,
        ])->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Detalhes da Disputa')
                    ->schema([
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options(Dispute::getStatuses())
                            ->disabled(),

                        Forms\Components\Textarea::make('resolution_notes')
                            ->label('Notas de Resolução')
                            ->columnSpanFull(),

                        Forms\Components\TextInput::make('refund_amount')
                            ->label('Valor do Reembolso')
                            ->numeric()
                            ->prefix('AOA'),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                Tables\Columns\TextColumn::make('order.reference')
                    ->label('Pedido')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('client.name')
                    ->label('Cliente')
                    ->searchable(),

                Tables\Columns\TextColumn::make('provider.user.name')
                    ->label('Prestador')
                    ->searchable(),

                Tables\Columns\TextColumn::make('reason')
                    ->label('Motivo')
                    ->formatStateUsing(fn (string $state) => Dispute::getReasons()[$state] ?? $state)
                    ->badge()
                    ->color('warning'),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->formatStateUsing(fn (string $state) => Dispute::getStatuses()[$state] ?? $state)
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        Dispute::STATUS_PENDING => 'warning',
                        Dispute::STATUS_UNDER_REVIEW => 'info',
                        Dispute::STATUS_RESOLVED_CLIENT => 'success',
                        Dispute::STATUS_RESOLVED_PROVIDER => 'success',
                        Dispute::STATUS_CANCELLED => 'gray',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('order.agreed_price')
                    ->label('Valor')
                    ->money('AOA')
                    ->sortable(),

                Tables\Columns\IconColumn::make('provider_response')
                    ->label('Resposta')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->getStateUsing(fn (Dispute $record) => !empty($record->provider_response)),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Criada em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options(Dispute::getStatuses()),

                Tables\Filters\SelectFilter::make('reason')
                    ->label('Motivo')
                    ->options(Dispute::getReasons()),

                Tables\Filters\Filter::make('pending_response')
                    ->label('Aguardando resposta')
                    ->query(fn (Builder $query) => $query->whereNull('provider_response')),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),

                Tables\Actions\Action::make('resolve_client')
                    ->label('Favor Cliente')
                    ->icon('heroicon-o-user')
                    ->color('success')
                    ->form([
                        Forms\Components\Textarea::make('resolution_notes')
                            ->label('Notas de Resolução')
                            ->required()
                            ->minLength(10)
                            ->placeholder('Explique a decisão...'),

                        Forms\Components\TextInput::make('refund_amount')
                            ->label('Valor do Reembolso')
                            ->numeric()
                            ->required()
                            ->prefix('AOA')
                            ->default(fn (Dispute $record) => $record->order->agreed_price ?? 0),
                    ])
                    ->visible(fn (Dispute $record) => in_array($record->status, [
                        Dispute::STATUS_PENDING,
                        Dispute::STATUS_UNDER_REVIEW,
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('Resolver a Favor do Cliente')
                    ->modalDescription('O cliente receberá um reembolso e o prestador será notificado.')
                    ->action(function (Dispute $record, array $data) {
                        try {
                            \Illuminate\Support\Facades\DB::transaction(function () use ($record, $data) {
                                app(\App\Services\WalletService::class)
                                    ->settleDispute($record->order, (float) $data['refund_amount']);
                            });
                        } catch (\Throwable $e) {
                            Notification::make()->title('Não foi possível reembolsar')->body($e->getMessage())->danger()->send();
                            return;
                        }

                        $record->update([
                            'status' => Dispute::STATUS_RESOLVED_CLIENT,
                            'resolution_notes' => $data['resolution_notes'],
                            'refund_amount' => $data['refund_amount'],
                            'resolved_at' => now(),
                            'resolved_by' => auth()->id(),
                        ]);

                        // Update order status
                        $record->order->update([
                            'status' => OrderStatus::CANCELLED,
                            'cancelled_at' => now(),
                            'cancellation_reason' => 'Disputa resolvida a favor do cliente',
                        ]);

                        Notification::make()
                            ->title('Disputa resolvida a favor do cliente')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('resolve_provider')
                    ->label('Favor Prestador')
                    ->icon('heroicon-o-briefcase')
                    ->color('info')
                    ->form([
                        Forms\Components\Textarea::make('resolution_notes')
                            ->label('Notas de Resolução')
                            ->required()
                            ->minLength(10)
                            ->placeholder('Explique a decisão...'),
                    ])
                    ->visible(fn (Dispute $record) => in_array($record->status, [
                        Dispute::STATUS_PENDING,
                        Dispute::STATUS_UNDER_REVIEW,
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('Resolver a Favor do Prestador')
                    ->modalDescription('O pedido será restaurado e o prestador será notificado.')
                    ->action(function (Dispute $record, array $data) {
                        $record->update([
                            'status' => Dispute::STATUS_RESOLVED_PROVIDER,
                            'resolution_notes' => $data['resolution_notes'],
                            'resolved_at' => now(),
                            'resolved_by' => auth()->id(),
                        ]);

                        // Restore order to delivered status
                        if ($record->order->delivered_at) {
                            $record->order->update(['status' => OrderStatus::DELIVERED]);
                        } else {
                            $record->order->update(['status' => OrderStatus::IN_PROGRESS]);
                        }

                        Notification::make()
                            ->title('Disputa resolvida a favor do prestador')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('mark_review')
                    ->label('Em Análise')
                    ->icon('heroicon-o-magnifying-glass')
                    ->color('warning')
                    ->visible(fn (Dispute $record) => $record->status === Dispute::STATUS_PENDING)
                    ->requiresConfirmation()
                    ->action(function (Dispute $record) {
                        $record->update([
                            'status' => Dispute::STATUS_UNDER_REVIEW,
                        ]);

                        Notification::make()
                            ->title('Disputa marcada como em análise')
                            ->success()
                            ->send();
                    }),
            ])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc')
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['order.service', 'client', 'provider.user', 'resolvedBy']));
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações do Pedido')
                    ->schema([
                        Infolists\Components\TextEntry::make('order.reference')
                            ->label('Referência'),
                        Infolists\Components\TextEntry::make('order.service.name')
                            ->label('Serviço'),
                        Infolists\Components\TextEntry::make('order.agreed_price')
                            ->label('Valor')
                            ->money('AOA'),
                        Infolists\Components\TextEntry::make('order.status')
                            ->label('Estado do Pedido')
                            ->badge(),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Partes Envolvidas')
                    ->schema([
                        Infolists\Components\TextEntry::make('client.name')
                            ->label('Cliente'),
                        Infolists\Components\TextEntry::make('client.email')
                            ->label('Email do Cliente'),
                        Infolists\Components\TextEntry::make('provider.user.name')
                            ->label('Prestador'),
                        Infolists\Components\TextEntry::make('provider.user.email')
                            ->label('Email do Prestador'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Reclamação do Cliente')
                    ->schema([
                        Infolists\Components\TextEntry::make('reason')
                            ->label('Motivo')
                            ->formatStateUsing(fn (string $state) => Dispute::getReasons()[$state] ?? $state)
                            ->badge()
                            ->color('warning'),
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Data da Reclamação')
                            ->dateTime('d/m/Y H:i'),
                        Infolists\Components\TextEntry::make('description')
                            ->label('Descrição')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Resposta do Prestador')
                    ->schema([
                        Infolists\Components\TextEntry::make('provider_responded_at')
                            ->label('Respondido em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('Ainda não respondeu'),
                        Infolists\Components\TextEntry::make('provider_response.text')
                            ->label('Resposta')
                            ->placeholder('Sem resposta')
                            ->columnSpanFull(),
                    ])
                    ->columns(1)
                    ->visible(fn (Dispute $record) => !empty($record->provider_response)),

                Infolists\Components\Section::make('Resolução')
                    ->schema([
                        Infolists\Components\TextEntry::make('status')
                            ->label('Estado')
                            ->formatStateUsing(fn (string $state) => Dispute::getStatuses()[$state] ?? $state)
                            ->badge()
                            ->color(fn (string $state) => match ($state) {
                                Dispute::STATUS_PENDING => 'warning',
                                Dispute::STATUS_UNDER_REVIEW => 'info',
                                Dispute::STATUS_RESOLVED_CLIENT => 'success',
                                Dispute::STATUS_RESOLVED_PROVIDER => 'success',
                                Dispute::STATUS_CANCELLED => 'gray',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('resolvedBy.name')
                            ->label('Resolvido por')
                            ->placeholder('Não resolvido'),
                        Infolists\Components\TextEntry::make('resolved_at')
                            ->label('Resolvido em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('refund_amount')
                            ->label('Valor Reembolsado')
                            ->money('AOA')
                            ->placeholder('Sem reembolso'),
                        Infolists\Components\TextEntry::make('resolution_notes')
                            ->label('Notas de Resolução')
                            ->placeholder('—')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListDisputes::route('/'),
            'view' => Pages\ViewDispute::route('/{record}'),
        ];
    }
}
