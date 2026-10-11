<?php

namespace App\Filament\Resources;

use App\Filament\Resources\AuditLogResource\Pages;
use App\Models\AuditLog;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class AuditLogResource extends Resource
{
    protected static ?string $model = AuditLog::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationGroup = 'Sistema';

    protected static ?string $modelLabel = 'registo de auditoria';

    protected static ?string $pluralModelLabel = 'logs de auditoria';

    protected static ?string $navigationLabel = 'Logs de auditoria';

    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with('user'))
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('created_at')->label('Data')->dateTime('d/m/Y H:i:s')->sortable(),
                Tables\Columns\TextColumn::make('user.name')->label('Utilizador')->placeholder('Sistema')->searchable(),
                Tables\Columns\TextColumn::make('action')->label('Acção')->badge()->color('gray')->searchable(),
                Tables\Columns\TextColumn::make('description')->label('Descrição')->wrap()->searchable()->limit(120),
                Tables\Columns\TextColumn::make('ip')->label('IP')->placeholder('—'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('action')->label('Acção')
                    ->options(fn () => AuditLog::query()->select('action')->distinct()->orderBy('action')->pluck('action', 'action')->all()),
            ])
            ->actions([])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return ['index' => Pages\ListAuditLogs::route('/')];
    }
}
