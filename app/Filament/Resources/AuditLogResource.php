<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AuditLogResource\Pages;
use App\Models\AuditLog;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AuditLogResource extends Resource
{
    protected static ?string $model = AuditLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationLabel = 'Logs de Auditoria';

    protected static ?string $modelLabel = 'Log de Auditoria';

    protected static ?string $pluralModelLabel = 'Logs de Auditoria';

    protected static ?string $navigationGroup = 'Sistema';

    protected static ?int $navigationSort = 99;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Data/Hora')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Utilizador')
                    ->placeholder('Sistema')
                    ->searchable(),

                Tables\Columns\TextColumn::make('action')
                    ->label('Ação')
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        AuditLog::ACTION_CREATE => 'Criação',
                        AuditLog::ACTION_UPDATE => 'Atualização',
                        AuditLog::ACTION_DELETE => 'Eliminação',
                        AuditLog::ACTION_STATUS_CHANGE => 'Mudança de Estado',
                        AuditLog::ACTION_PAYMENT => 'Pagamento',
                        AuditLog::ACTION_PAYOUT => 'Levantamento',
                        AuditLog::ACTION_DISPUTE => 'Disputa',
                        AuditLog::ACTION_KYC => 'Verificação KYC',
                        AuditLog::ACTION_LOGIN => 'Login',
                        AuditLog::ACTION_LOGOUT => 'Logout',
                        default => $state,
                    })
                    ->badge()
                    ->color(fn (string $state) => match ($state) {
                        AuditLog::ACTION_CREATE => 'success',
                        AuditLog::ACTION_UPDATE => 'info',
                        AuditLog::ACTION_DELETE => 'danger',
                        AuditLog::ACTION_STATUS_CHANGE => 'warning',
                        AuditLog::ACTION_PAYMENT => 'success',
                        AuditLog::ACTION_PAYOUT => 'primary',
                        AuditLog::ACTION_DISPUTE => 'danger',
                        AuditLog::ACTION_KYC => 'info',
                        default => 'gray',
                    }),

                Tables\Columns\TextColumn::make('auditable_type')
                    ->label('Modelo')
                    ->formatStateUsing(fn (?string $state) => $state ? class_basename($state) : '—')
                    ->badge()
                    ->color('gray'),

                Tables\Columns\TextColumn::make('auditable_id')
                    ->label('ID')
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('ip_address')
                    ->label('IP')
                    ->placeholder('—')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('action')
                    ->label('Ação')
                    ->options([
                        AuditLog::ACTION_CREATE => 'Criação',
                        AuditLog::ACTION_UPDATE => 'Atualização',
                        AuditLog::ACTION_DELETE => 'Eliminação',
                        AuditLog::ACTION_STATUS_CHANGE => 'Mudança de Estado',
                        AuditLog::ACTION_PAYMENT => 'Pagamento',
                        AuditLog::ACTION_PAYOUT => 'Levantamento',
                        AuditLog::ACTION_DISPUTE => 'Disputa',
                        AuditLog::ACTION_KYC => 'Verificação KYC',
                    ]),

                Tables\Filters\SelectFilter::make('auditable_type')
                    ->label('Modelo')
                    ->options([
                        'App\\Models\\Order' => 'Pedidos',
                        'App\\Models\\Payout' => 'Levantamentos',
                        'App\\Models\\Dispute' => 'Disputas',
                        'App\\Models\\KycVerification' => 'Verificações KYC',
                    ]),

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
            ])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc')
            ->modifyQueryUsing(fn (Builder $query) => $query->with('user'));
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações do Log')
                    ->schema([
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Data/Hora')
                            ->dateTime('d/m/Y H:i:s'),
                        Infolists\Components\TextEntry::make('user.name')
                            ->label('Utilizador')
                            ->placeholder('Sistema'),
                        Infolists\Components\TextEntry::make('action_label')
                            ->label('Ação'),
                        Infolists\Components\TextEntry::make('auditable_type')
                            ->label('Modelo')
                            ->formatStateUsing(fn (?string $state) => $state ? class_basename($state) : '—'),
                        Infolists\Components\TextEntry::make('auditable_id')
                            ->label('ID do Registro'),
                        Infolists\Components\TextEntry::make('ip_address')
                            ->label('Endereço IP')
                            ->placeholder('—'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Valores Anteriores')
                    ->schema([
                        Infolists\Components\KeyValueEntry::make('old_values')
                            ->label('')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn ($record) => !empty($record->old_values))
                    ->collapsible(),

                Infolists\Components\Section::make('Novos Valores')
                    ->schema([
                        Infolists\Components\KeyValueEntry::make('new_values')
                            ->label('')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn ($record) => !empty($record->new_values))
                    ->collapsible(),

                Infolists\Components\Section::make('Metadados')
                    ->schema([
                        Infolists\Components\KeyValueEntry::make('metadata')
                            ->label('')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn ($record) => !empty($record->metadata))
                    ->collapsible(),

                Infolists\Components\Section::make('Informações do Navegador')
                    ->schema([
                        Infolists\Components\TextEntry::make('user_agent')
                            ->label('User Agent')
                            ->columnSpanFull(),
                    ])
                    ->visible(fn ($record) => !empty($record->user_agent))
                    ->collapsible(),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListAuditLogs::route('/'),
            'view' => Pages\ViewAuditLog::route('/{record}'),
        ];
    }
}
