<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PayoutResource\Pages;
use App\Models\Payout;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PayoutResource extends Resource
{
    protected static ?string $model = Payout::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Levantamentos';

    protected static ?string $modelLabel = 'Levantamento';

    protected static ?string $pluralModelLabel = 'Levantamentos';

    protected static ?string $navigationGroup = 'Financeiro';

    protected static ?int $navigationSort = 1;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', Payout::STATUS_PENDING)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Detalhes do Levantamento')
                    ->schema([
                        Forms\Components\TextInput::make('reference')
                            ->label('Referência')
                            ->disabled(),

                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options(Payout::getStatuses())
                            ->disabled(),

                        Forms\Components\Textarea::make('notes')
                            ->label('Notas')
                            ->columnSpanFull(),

                        Forms\Components\Textarea::make('failure_reason')
                            ->label('Motivo da Falha')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('reference')
                    ->label('Referência')
                    ->searchable()
                    ->sortable()
                    ->copyable(),

                Tables\Columns\TextColumn::make('provider.user.name')
                    ->label('Prestador')
                    ->searchable(),

                Tables\Columns\TextColumn::make('payoutMethod.name')
                    ->label('Método')
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Valor Bruto')
                    ->money('AOA')
                    ->sortable(),

                Tables\Columns\TextColumn::make('fee')
                    ->label('Taxa')
                    ->money('AOA')
                    ->color('danger'),

                Tables\Columns\TextColumn::make('net_amount')
                    ->label('Valor Líquido')
                    ->money('AOA')
                    ->color('success')
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->formatStateUsing(fn (string $state) => Payout::getStatuses()[$state] ?? $state)
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        Payout::STATUS_PENDING => 'warning',
                        Payout::STATUS_PROCESSING => 'info',
                        Payout::STATUS_COMPLETED => 'success',
                        Payout::STATUS_FAILED => 'danger',
                        Payout::STATUS_CANCELLED => 'gray',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Solicitado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('completed_at')
                    ->label('Concluído em')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('—'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options(Payout::getStatuses()),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        Forms\Components\DatePicker::make('from')
                            ->label('De'),
                        Forms\Components\DatePicker::make('until')
                            ->label('Até'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),

                Tables\Actions\Action::make('process')
                    ->label('Processar')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->visible(fn (Payout $record) => $record->status === Payout::STATUS_PENDING)
                    ->requiresConfirmation()
                    ->modalHeading('Iniciar Processamento')
                    ->modalDescription('Marcar este levantamento como em processamento?')
                    ->action(function (Payout $record) {
                        $record->update([
                            'status' => Payout::STATUS_PROCESSING,
                            'processed_at' => now(),
                            'processed_by' => auth()->id(),
                        ]);

                        Notification::make()
                            ->title('Levantamento em processamento')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('complete')
                    ->label('Concluir')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn (Payout $record) => in_array($record->status, [
                        Payout::STATUS_PENDING,
                        Payout::STATUS_PROCESSING,
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('Concluir Levantamento')
                    ->modalDescription('Confirma que o pagamento foi efectuado ao prestador?')
                    ->action(function (Payout $record) {
                        $record->update([
                            'status' => Payout::STATUS_COMPLETED,
                            'completed_at' => now(),
                            'processed_by' => auth()->id(),
                        ]);

                        Notification::make()
                            ->title('Levantamento concluído')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('fail')
                    ->label('Falhou')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->form([
                        Forms\Components\Textarea::make('failure_reason')
                            ->label('Motivo da Falha')
                            ->required()
                            ->minLength(10)
                            ->placeholder('Explique o que aconteceu...'),
                    ])
                    ->visible(fn (Payout $record) => in_array($record->status, [
                        Payout::STATUS_PENDING,
                        Payout::STATUS_PROCESSING,
                    ]))
                    ->requiresConfirmation()
                    ->modalHeading('Marcar como Falhou')
                    ->action(function (Payout $record, array $data) {
                        $record->update([
                            'status' => Payout::STATUS_FAILED,
                            'failure_reason' => $data['failure_reason'],
                            'processed_by' => auth()->id(),
                        ]);

                        Notification::make()
                            ->title('Levantamento marcado como falhou')
                            ->warning()
                            ->send();
                    }),
            ])
            ->bulkActions([
                Tables\Actions\BulkAction::make('bulk_process')
                    ->label('Processar Selecionados')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->requiresConfirmation()
                    ->action(function ($records) {
                        $count = 0;
                        foreach ($records as $record) {
                            if ($record->status === Payout::STATUS_PENDING) {
                                $record->update([
                                    'status' => Payout::STATUS_PROCESSING,
                                    'processed_at' => now(),
                                    'processed_by' => auth()->id(),
                                ]);
                                $count++;
                            }
                        }

                        Notification::make()
                            ->title("{$count} levantamentos em processamento")
                            ->success()
                            ->send();
                    }),

                Tables\Actions\BulkAction::make('bulk_complete')
                    ->label('Concluir Selecionados')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function ($records) {
                        $count = 0;
                        foreach ($records as $record) {
                            if (in_array($record->status, [Payout::STATUS_PENDING, Payout::STATUS_PROCESSING])) {
                                $record->update([
                                    'status' => Payout::STATUS_COMPLETED,
                                    'completed_at' => now(),
                                    'processed_by' => auth()->id(),
                                ]);
                                $count++;
                            }
                        }

                        Notification::make()
                            ->title("{$count} levantamentos concluídos")
                            ->success()
                            ->send();
                    }),
            ])
            ->defaultSort('created_at', 'desc')
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['provider.user', 'payoutMethod', 'processedBy']));
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações do Levantamento')
                    ->schema([
                        Infolists\Components\TextEntry::make('reference')
                            ->label('Referência')
                            ->copyable(),
                        Infolists\Components\TextEntry::make('status')
                            ->label('Estado')
                            ->formatStateUsing(fn (string $state) => Payout::getStatuses()[$state] ?? $state)
                            ->badge()
                            ->color(fn (string $state) => match ($state) {
                                Payout::STATUS_PENDING => 'warning',
                                Payout::STATUS_PROCESSING => 'info',
                                Payout::STATUS_COMPLETED => 'success',
                                Payout::STATUS_FAILED => 'danger',
                                Payout::STATUS_CANCELLED => 'gray',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Solicitado em')
                            ->dateTime('d/m/Y H:i'),
                        Infolists\Components\TextEntry::make('completed_at')
                            ->label('Concluído em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('—'),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Prestador')
                    ->schema([
                        Infolists\Components\TextEntry::make('provider.user.name')
                            ->label('Nome'),
                        Infolists\Components\TextEntry::make('provider.user.email')
                            ->label('Email'),
                        Infolists\Components\TextEntry::make('provider.user.phone')
                            ->label('Telefone')
                            ->placeholder('—'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Valores')
                    ->schema([
                        Infolists\Components\TextEntry::make('amount')
                            ->label('Valor Bruto')
                            ->money('AOA'),
                        Infolists\Components\TextEntry::make('fee')
                            ->label('Taxa da Plataforma (10%)')
                            ->money('AOA')
                            ->color('danger'),
                        Infolists\Components\TextEntry::make('net_amount')
                            ->label('Valor Líquido a Pagar')
                            ->money('AOA')
                            ->color('success')
                            ->weight('bold'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Método de Pagamento')
                    ->schema([
                        Infolists\Components\TextEntry::make('payoutMethod.name')
                            ->label('Nome'),
                        Infolists\Components\TextEntry::make('payoutMethod.type')
                            ->label('Tipo')
                            ->formatStateUsing(fn (?string $state) => match ($state) {
                                'bank_transfer' => 'Transferência Bancária',
                                'mobile_money' => 'Mobile Money',
                                'express' => 'Express/Multicaixa',
                                default => $state ?? '—',
                            }),
                        Infolists\Components\TextEntry::make('payoutMethod.bank_name')
                            ->label('Banco')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('payoutMethod.account_number')
                            ->label('Número da Conta')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('payoutMethod.account_holder')
                            ->label('Titular')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('payoutMethod.iban')
                            ->label('IBAN')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('payoutMethod.phone_number')
                            ->label('Telefone (Mobile Money)')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('payoutMethod.provider_name')
                            ->label('Operadora')
                            ->placeholder('—'),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Notas e Histórico')
                    ->schema([
                        Infolists\Components\TextEntry::make('notes')
                            ->label('Notas do Prestador')
                            ->placeholder('Sem notas')
                            ->columnSpanFull(),
                        Infolists\Components\TextEntry::make('failure_reason')
                            ->label('Motivo da Falha')
                            ->placeholder('—')
                            ->color('danger')
                            ->columnSpanFull(),
                        Infolists\Components\TextEntry::make('processedBy.name')
                            ->label('Processado por')
                            ->placeholder('—'),
                        Infolists\Components\TextEntry::make('processed_at')
                            ->label('Processado em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('—'),
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
            'index' => Pages\ListPayouts::route('/'),
            'view' => Pages\ViewPayout::route('/{record}'),
        ];
    }
}
