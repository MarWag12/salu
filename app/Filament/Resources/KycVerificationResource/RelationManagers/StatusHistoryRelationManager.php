<?php

namespace App\Filament\Resources\KycVerificationResource\RelationManagers;

use App\Enums\KycStatus;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class StatusHistoryRelationManager extends RelationManager
{
    protected static string $relationship = 'statusHistory';

    protected static ?string $title = 'Histórico de Estados';

    protected static ?string $modelLabel = 'Alteração';

    protected static ?string $pluralModelLabel = 'Alterações';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('id')
            ->columns([
                Tables\Columns\TextColumn::make('from_status')
                    ->label('De')
                    ->formatStateUsing(fn (?KycStatus $state) => $state?->label() ?? '—')
                    ->badge()
                    ->color(fn (?KycStatus $state) => $state?->color() ?? 'gray'),

                Tables\Columns\TextColumn::make('to_status')
                    ->label('Para')
                    ->formatStateUsing(fn (KycStatus $state) => $state->label())
                    ->badge()
                    ->color(fn (KycStatus $state) => $state->color()),

                Tables\Columns\TextColumn::make('reason')
                    ->label('Motivo')
                    ->placeholder('—')
                    ->limit(50)
                    ->tooltip(fn ($record) => $record->reason),

                Tables\Columns\TextColumn::make('changedBy.name')
                    ->label('Por')
                    ->placeholder('Sistema'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Data')
                    ->dateTime('d/m/Y H:i'),
            ])
            ->filters([])
            ->headerActions([])
            ->actions([])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc');
    }
}
