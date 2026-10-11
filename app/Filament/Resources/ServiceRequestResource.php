<?php

namespace App\Filament\Resources;

use App\Filament\Actions\OrderActions;
use App\Filament\Resources\ServiceRequestResource\Pages;
use App\Models\ServiceRequest;
use App\Support\Format;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ServiceRequestResource extends Resource
{
    protected static ?string $model = ServiceRequest::class;

    protected static ?string $navigationIcon = 'heroicon-o-clipboard-document-list';

    protected static ?string $navigationGroup = 'Gestão de Pedidos';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'pedido';

    protected static ?string $pluralModelLabel = 'pedidos';

    protected static ?string $recordTitleAttribute = 'code';

    public static function getNavigationBadge(): ?string
    {
        $n = ServiceRequest::where('status', ServiceRequest::PENDENTE)->count();

        return $n ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): string|array|null
    {
        return 'warning';
    }

    public static function canCreate(): bool
    {
        return false; // Os pedidos são criados pelos clientes no site.
    }

    public static function statusColor(string $state): string
    {
        return ['pendente' => 'warning', 'atribuido' => 'info', 'em_curso' => 'primary', 'concluido' => 'success', 'cancelado' => 'danger'][$state] ?? 'gray';
    }

    /** Colunas reutilizadas na tabela de pedidos e no widget do dashboard. */
    public static function summaryColumns(): array
    {
        return [
            Tables\Columns\TextColumn::make('code')->label('Código')->searchable()->sortable()->weight('bold'),
            Tables\Columns\TextColumn::make('service.name')->label('Serviço')->limit(32),
            Tables\Columns\TextColumn::make('client.name')->label('Cliente')->searchable(),
            Tables\Columns\TextColumn::make('technician.user.name')->label('Técnico')->placeholder('— por atribuir'),
            Tables\Columns\TextColumn::make('scheduled_at')->label('Data')->dateTime('d/m/Y H:i')->sortable(),
            Tables\Columns\TextColumn::make('price')->label('Valor')->formatStateUsing(fn ($state) => Format::aoa($state)),
            Tables\Columns\TextColumn::make('status')->label('Estado')->badge()
                ->formatStateUsing(fn (string $state) => ServiceRequest::STATUSES[$state][0] ?? $state)
                ->color(fn (string $state) => static::statusColor($state)),
        ];
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['service', 'client', 'technician.user']))
            ->defaultSort('created_at', 'desc')
            ->columns(static::summaryColumns())
            ->filters([
                Tables\Filters\SelectFilter::make('status')->label('Estado')
                    ->options(collect(ServiceRequest::STATUSES)->map(fn ($v) => $v[0])->all()),
            ])
            ->actions([
                Tables\Actions\ViewAction::make()->label('Abrir'),
                OrderActions::assign(Tables\Actions\Action::class),
                OrderActions::cancel(Tables\Actions\Action::class),
            ])
            ->bulkActions([]);
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist->schema([
            Infolists\Components\Section::make('Detalhes do serviço')->schema([
                Infolists\Components\TextEntry::make('code')->label('Código')->weight('bold'),
                Infolists\Components\TextEntry::make('status')->label('Estado')->badge()
                    ->formatStateUsing(fn (string $state) => ServiceRequest::STATUSES[$state][0] ?? $state)
                    ->color(fn (string $state) => static::statusColor($state)),
                Infolists\Components\TextEntry::make('service.name')->label('Serviço'),
                Infolists\Components\TextEntry::make('service.category.name')->label('Categoria')->badge(),
                Infolists\Components\TextEntry::make('scheduled_at')->label('Data agendada')->dateTime('d/m/Y \à\s H:i'),
                Infolists\Components\TextEntry::make('price')->label('Valor')->formatStateUsing(fn ($state) => Format::aoa($state)),
                Infolists\Components\TextEntry::make('address')->label('Morada')
                    ->formatStateUsing(fn ($state, ServiceRequest $record) => $state.' — '.$record->municipality),
                Infolists\Components\TextEntry::make('description')->label('Descrição')->placeholder('—'),
                Infolists\Components\TextEntry::make('completed_at')->label('Concluído em')->dateTime('d/m/Y H:i')->visible(fn (ServiceRequest $record) => (bool) $record->completed_at),
                Infolists\Components\TextEntry::make('cancel_reason')->label('Motivo do cancelamento')->visible(fn (ServiceRequest $record) => (bool) $record->cancel_reason),
            ])->columns(2),

            Infolists\Components\Section::make('Pessoas')->schema([
                Infolists\Components\TextEntry::make('client.name')->label('Cliente')
                    ->description(fn (ServiceRequest $record) => $record->client->email.' · '.($record->client->phone ?: 'sem telefone')),
                Infolists\Components\TextEntry::make('technician.user.name')->label('Técnico')->placeholder('Por atribuir')
                    ->description(fn (ServiceRequest $record) => $record->technician?->user?->phone),
            ])->columns(2),

            Infolists\Components\Section::make('Pagamentos')->schema([
                Infolists\Components\RepeatableEntry::make('payments')->label('')->schema([
                    Infolists\Components\TextEntry::make('method')->label('Método')
                        ->formatStateUsing(fn ($state) => \App\Models\Payment::METHODS[$state] ?? $state),
                    Infolists\Components\TextEntry::make('reference')->label('Referência')->placeholder('—'),
                    Infolists\Components\TextEntry::make('amount')->label('Valor')->formatStateUsing(fn ($state) => Format::aoa($state)),
                    Infolists\Components\TextEntry::make('status')->label('Estado')->badge()
                        ->color(fn (string $state) => $state === 'confirmado' ? 'success' : 'warning'),
                ])->columns(4)->placeholder('Sem pagamentos registados.'),
            ]),

            Infolists\Components\Section::make('Avaliação do cliente')->schema([
                Infolists\Components\TextEntry::make('review.rating')->label('Classificação')
                    ->formatStateUsing(fn ($state) => str_repeat('★', (int) $state).str_repeat('☆', 5 - (int) $state)),
                Infolists\Components\TextEntry::make('review.comment')->label('Comentário')->placeholder('Sem comentário.'),
            ])->columns(2)->visible(fn (ServiceRequest $record) => (bool) $record->review),

            Infolists\Components\Section::make('Disputas')->schema([
                Infolists\Components\RepeatableEntry::make('disputes')->label('')->schema([
                    Infolists\Components\TextEntry::make('status')->label('Estado')->badge()
                        ->color(fn (string $state) => $state === 'aberta' ? 'danger' : 'success'),
                    Infolists\Components\TextEntry::make('reason')->label('Motivo'),
                    Infolists\Components\TextEntry::make('resolution')->label('Resolução')->placeholder('—'),
                ])->columns(3),
            ])->visible(fn (ServiceRequest $record) => $record->disputes()->exists()),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListServiceRequests::route('/'),
            'view' => Pages\ViewServiceRequest::route('/{record}'),
        ];
    }
}
