<?php

namespace App\Filament\Resources;

use App\Filament\Resources\WalletTopUpRequestResource\Pages;
use App\Filament\Resources\WalletTopUpRequestResource\RelationManagers;
use App\Models\WalletTopUpRequest;
use App\Services\WalletService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Notifications\Notification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;

class WalletTopUpRequestResource extends Resource
{
    protected static ?string $model = WalletTopUpRequest::class;

    protected static ?string $navigationIcon = 'heroicon-o-banknotes';

    protected static ?string $navigationLabel = 'Pedidos de Recarga';

    protected static ?string $modelLabel = 'Pedido de Recarga';

    protected static ?string $pluralModelLabel = 'Pedidos de Recarga';

    protected static ?string $navigationGroup = 'Financeiro';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Select::make('user_id')
                    ->label('Cliente')
                    ->relationship('user', 'name')
                    ->required()
                    ->searchable()
                    ->disabled(fn ($record) => $record !== null),

                Forms\Components\TextInput::make('amount')
                    ->label('Valor (AOA)')
                    ->required()
                    ->numeric()
                    ->prefix('AOA')
                    ->disabled(fn ($record) => $record !== null),

                Forms\Components\Select::make('status')
                    ->label('Status')
                    ->options([
                        'pending' => 'Pendente',
                        'approved' => 'Aprovado',
                        'rejected' => 'Rejeitado',
                    ])
                    ->required()
                    ->disabled(),

                Forms\Components\Textarea::make('notes')
                    ->label('Notas do Cliente')
                    ->disabled()
                    ->columnSpanFull(),

                Forms\Components\Textarea::make('admin_notes')
                    ->label('Notas do Admin')
                    ->columnSpanFull(),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Cliente')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable(),

                Tables\Columns\TextColumn::make('amount')
                    ->label('Valor')
                    ->money('AOA')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'approved',
                        'danger' => 'rejected',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'pending' => 'Pendente',
                        'approved' => 'Aprovado',
                        'rejected' => 'Rejeitado',
                        default => $state,
                    }),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Solicitado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),

                Tables\Columns\TextColumn::make('approved_at')
                    ->label('Processado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('approvedBy.name')
                    ->label('Processado por')
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'pending' => 'Pendente',
                        'approved' => 'Aprovado',
                        'rejected' => 'Rejeitado',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->label('Aprovar')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->visible(fn (WalletTopUpRequest $record) => $record->isPending())
                    ->form([
                        Forms\Components\Textarea::make('admin_notes')
                            ->label('Notas (opcional)')
                            ->placeholder('Ex: Comprovante verificado'),
                    ])
                    ->action(function (WalletTopUpRequest $record, array $data) {
                        $walletService = app(WalletService::class);

                        // Add balance to user's wallet
                        $walletService->topUp(
                            $record->user,
                            $record->amount,
                            "Recarga aprovada - Pedido #{$record->id}",
                            [
                                'request_id' => $record->id,
                                'approved_by' => auth()->id(),
                            ]
                        );

                        // Update request
                        $record->update([
                            'status' => 'approved',
                            'admin_notes' => $data['admin_notes'] ?? null,
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);

                        Notification::make()
                            ->title('Recarga Aprovada')
                            ->success()
                            ->body("Saldo de {$record->formatted_amount} adicionado à carteira de {$record->user->name}")
                            ->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Rejeitar')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn (WalletTopUpRequest $record) => $record->isPending())
                    ->form([
                        Forms\Components\Textarea::make('admin_notes')
                            ->label('Motivo da Rejeição')
                            ->required()
                            ->placeholder('Ex: Comprovante inválido'),
                    ])
                    ->action(function (WalletTopUpRequest $record, array $data) {
                        $record->update([
                            'status' => 'rejected',
                            'admin_notes' => $data['admin_notes'],
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);

                        Notification::make()
                            ->title('Recarga Rejeitada')
                            ->danger()
                            ->body("Pedido de {$record->formatted_amount} de {$record->user->name} foi rejeitado")
                            ->send();
                    }),

                Tables\Actions\ViewAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make()
                        ->visible(fn () => auth()->user()->type === 'admin'),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWalletTopUpRequests::route('/'),
            'view' => Pages\ViewWalletTopUpRequest::route('/{record}'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', 'pending')->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }
}
