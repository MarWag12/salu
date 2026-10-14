<?php

namespace App\Filament\Resources;

use App\Enums\PaymentGateway;
use App\Enums\PaymentStatus;
use App\Filament\Resources\PaymentResource\Pages;
use App\Models\Payment;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static ?string $navigationIcon = 'heroicon-o-credit-card';

    protected static ?string $navigationLabel = 'Pagamentos';

    protected static ?string $modelLabel = 'Pagamento';

    protected static ?string $pluralModelLabel = 'Pagamentos';

    protected static ?string $navigationGroup = 'Financeiro';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                // Read-only - payments should not be edited
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                Tables\Columns\TextColumn::make('serviceProvider.user.name')
                    ->label('Prestador')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('service.name')
                    ->label('Serviço')
                    ->searchable()
                    ->limit(30),

                Tables\Columns\TextColumn::make('highlightPlan.name')
                    ->label('Plano')
                    ->badge(),

                Tables\Columns\TextColumn::make('formatted_amount')
                    ->label('Valor'),

                Tables\Columns\TextColumn::make('gateway')
                    ->label('Gateway')
                    ->badge()
                    ->formatStateUsing(fn (PaymentGateway $state) => $state->label()),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (PaymentStatus $state) => $state->color())
                    ->formatStateUsing(fn (PaymentStatus $state) => $state->label()),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options(collect(PaymentStatus::cases())->mapWithKeys(fn ($status) => [$status->value => $status->label()])),

                Tables\Filters\SelectFilter::make('gateway')
                    ->label('Gateway')
                    ->options(collect(PaymentGateway::cases())->mapWithKeys(fn ($gateway) => [$gateway->value => $gateway->label()])),

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
            ->bulkActions([
                // No bulk actions for payments
            ]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações do Pagamento')
                    ->schema([
                        Infolists\Components\TextEntry::make('id')
                            ->label('ID'),

                        Infolists\Components\TextEntry::make('external_id')
                            ->label('ID Externo')
                            ->copyable(),

                        Infolists\Components\TextEntry::make('status')
                            ->label('Estado')
                            ->badge()
                            ->color(fn (PaymentStatus $state) => $state->color())
                            ->formatStateUsing(fn (PaymentStatus $state) => $state->label()),

                        Infolists\Components\TextEntry::make('gateway')
                            ->label('Gateway')
                            ->badge()
                            ->formatStateUsing(fn (PaymentGateway $state) => $state->label()),

                        Infolists\Components\TextEntry::make('formatted_amount')
                            ->label('Valor'),

                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Data de Criação')
                            ->dateTime('d/m/Y H:i:s'),

                        Infolists\Components\TextEntry::make('updated_at')
                            ->label('Última Actualização')
                            ->dateTime('d/m/Y H:i:s'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Serviço')
                    ->schema([
                        Infolists\Components\TextEntry::make('service.name')
                            ->label('Nome do Serviço'),

                        Infolists\Components\TextEntry::make('serviceProvider.user.name')
                            ->label('Prestador'),

                        Infolists\Components\TextEntry::make('serviceProvider.user.email')
                            ->label('Email'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Plano')
                    ->schema([
                        Infolists\Components\TextEntry::make('highlightPlan.name')
                            ->label('Nome do Plano'),

                        Infolists\Components\TextEntry::make('highlightPlan.duration_label')
                            ->label('Duração'),

                        Infolists\Components\TextEntry::make('highlightPlan.formatted_price')
                            ->label('Preço'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Resposta do Gateway')
                    ->schema([
                        Infolists\Components\TextEntry::make('gateway_response')
                            ->label('')
                            ->formatStateUsing(fn ($state) => json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))
                            ->prose(),
                    ])
                    ->collapsible()
                    ->collapsed(),
            ]);
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
            'index' => Pages\ListPayments::route('/'),
            'view' => Pages\ViewPayment::route('/{record}'),
        ];
    }

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
}
