<?php

namespace App\Filament\Resources;

use App\Filament\Resources\DisputeResource\Pages;
use App\Models\AuditLog;
use App\Models\Dispute;
use Filament\Forms;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class DisputeResource extends Resource
{
    protected static ?string $model = Dispute::class;

    protected static ?string $navigationIcon = 'heroicon-o-exclamation-triangle';

    protected static ?string $navigationGroup = 'Gestão de Pedidos';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'disputa';

    protected static ?string $pluralModelLabel = 'disputas';

    public static function getNavigationBadge(): ?string
    {
        $n = Dispute::where('status', 'aberta')->count();

        return $n ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): string|array|null
    {
        return 'danger';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['serviceRequest.service', 'user']))
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('serviceRequest.code')->label('Pedido')->weight('bold')->searchable()
                    ->url(fn (Dispute $record) => ServiceRequestResource::getUrl('view', ['record' => $record->service_request_id])),
                Tables\Columns\TextColumn::make('user.name')->label('Aberta por'),
                Tables\Columns\TextColumn::make('reason')->label('Motivo')->limit(60)->wrap()
                    ->tooltip(fn (Dispute $record) => $record->reason),
                Tables\Columns\TextColumn::make('status')->label('Estado')->badge()
                    ->formatStateUsing(fn (string $state) => ucfirst($state))
                    ->color(fn (string $state) => $state === 'aberta' ? 'danger' : 'success'),
                Tables\Columns\TextColumn::make('resolution')->label('Resolução')->limit(50)->placeholder('—')
                    ->tooltip(fn (Dispute $record) => $record->resolution),
                Tables\Columns\TextColumn::make('created_at')->label('Data')->dateTime('d/m/Y H:i')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->label('Estado')->options(['aberta' => 'Aberta', 'resolvida' => 'Resolvida']),
            ])
            ->actions([
                Tables\Actions\Action::make('resolve')->label('Resolver')->icon('heroicon-o-check-badge')->color('success')
                    ->modalHeading('Resolver disputa')
                    ->visible(fn (Dispute $record) => $record->status === 'aberta')
                    ->form([Forms\Components\Textarea::make('resolution')->label('Resolução')->required()->minLength(5)->maxLength(2000)->rows(4)])
                    ->action(function (Dispute $record, array $data) {
                        $record->update(['status' => 'resolvida', 'resolution' => $data['resolution']]);
                        AuditLog::record('disputa_resolvida', "Disputa do pedido {$record->serviceRequest->code} resolvida");
                        Notification::make()->success()->title('Disputa resolvida.')->send();
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return ['index' => Pages\ListDisputes::route('/')];
    }
}
