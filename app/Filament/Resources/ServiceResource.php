<?php

namespace App\Filament\Resources;

use App\Enums\ServiceStatus;
use App\Filament\Resources\ServiceResource\Pages;
use App\Models\Category;
use App\Models\Service;
use App\Services\ServiceService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ServiceResource extends Resource
{
    protected static ?string $model = Service::class;

    protected static ?string $navigationIcon = 'heroicon-o-briefcase';

    protected static ?string $navigationLabel = 'Serviços';

    protected static ?string $modelLabel = 'Serviço';

    protected static ?string $pluralModelLabel = 'Serviços';

    protected static ?string $navigationGroup = 'Gestão de Serviços';

    protected static ?int $navigationSort = 2;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::where('status', ServiceStatus::PENDING)->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informações do Serviço')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->disabled(),

                        Forms\Components\Select::make('category_id')
                            ->label('Categoria')
                            ->relationship('category', 'name')
                            ->disabled(),

                        Forms\Components\Textarea::make('description')
                            ->label('Descrição')
                            ->rows(4)
                            ->disabled(),

                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options(ServiceStatus::class)
                            ->disabled(),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('cover')
                    ->label('Capa')
                    ->getStateUsing(fn (Service $record) => $record->getFirstMediaUrl('cover', 'thumb'))
                    ->circular(false)
                    ->width(60)
                    ->height(60),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable()
                    ->limit(30),

                Tables\Columns\TextColumn::make('serviceProvider.user.name')
                    ->label('Prestador')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('category.name')
                    ->label('Categoria')
                    ->sortable(),

                Tables\Columns\TextColumn::make('formatted_price')
                    ->label('Preço')
                    ->suffix(' AOA'),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (ServiceStatus $state) => $state->label())
                    ->color(fn (ServiceStatus $state) => $state->color()),

                Tables\Columns\TextColumn::make('view_count')
                    ->label('Visualizações')
                    ->alignCenter()
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options(ServiceStatus::class),

                Tables\Filters\SelectFilter::make('category_id')
                    ->label('Categoria')
                    ->options(fn () => Category::pluck('name', 'id')),

                Tables\Filters\Filter::make('featured')
                    ->label('Em Destaque')
                    ->query(fn (Builder $query) => $query->where('status', ServiceStatus::FEATURED)
                        ->where('highlight_expires_at', '>', now())),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),

                Tables\Actions\Action::make('approve')
                    ->label('Aprovar')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Aprovar Serviço')
                    ->modalDescription('Tem certeza que deseja aprovar este serviço? Ele será publicado.')
                    ->visible(fn (Service $record) => $record->status === ServiceStatus::PENDING)
                    ->action(function (Service $record) {
                        $service = app(ServiceService::class);
                        $service->approve($record);

                        Notification::make()
                            ->title('Serviço aprovado com sucesso')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('suspend')
                    ->label('Suspender')
                    ->icon('heroicon-o-pause-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Suspender Serviço')
                    ->modalDescription('Tem certeza que deseja suspender este serviço? Ele não será mais visível.')
                    ->visible(fn (Service $record) => in_array($record->status, [ServiceStatus::PUBLISHED, ServiceStatus::FEATURED]))
                    ->action(function (Service $record) {
                        $service = app(ServiceService::class);
                        $service->suspend($record);

                        Notification::make()
                            ->title('Serviço suspenso')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('reactivate')
                    ->label('Reactivar')
                    ->icon('heroicon-o-play-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Reactivar Serviço')
                    ->modalDescription('Tem certeza que deseja reactivar este serviço?')
                    ->visible(fn (Service $record) => $record->status === ServiceStatus::SUSPENDED)
                    ->action(function (Service $record) {
                        $service = app(ServiceService::class);
                        $service->approve($record);

                        Notification::make()
                            ->title('Serviço reactivado')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\DeleteAction::make()
                    ->requiresConfirmation()
                    ->modalDescription('Esta acção é irreversível. O serviço e todas as imagens serão eliminados.'),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações Básicas')
                    ->schema([
                        Infolists\Components\TextEntry::make('name')
                            ->label('Nome'),

                        Infolists\Components\TextEntry::make('category.name')
                            ->label('Categoria'),

                        Infolists\Components\TextEntry::make('serviceProvider.user.name')
                            ->label('Prestador'),

                        Infolists\Components\TextEntry::make('status')
                            ->label('Estado')
                            ->badge()
                            ->formatStateUsing(fn (ServiceStatus $state) => $state->label())
                            ->color(fn (ServiceStatus $state) => $state->color()),

                        Infolists\Components\TextEntry::make('description')
                            ->label('Descrição')
                            ->columnSpanFull(),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Preço')
                    ->schema([
                        Infolists\Components\TextEntry::make('price_type')
                            ->label('Tipo')
                            ->formatStateUsing(fn ($state) => $state->label()),

                        Infolists\Components\TextEntry::make('formatted_price')
                            ->label('Valor')
                            ->suffix(' AOA'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Detalhes')
                    ->schema([
                        Infolists\Components\TextEntry::make('location')
                            ->label('Localização')
                            ->placeholder('Não especificado'),

                        Infolists\Components\TextEntry::make('delivery_time')
                            ->label('Tempo de Entrega')
                            ->placeholder('Não especificado'),

                        Infolists\Components\TextEntry::make('tags')
                            ->label('Tags')
                            ->badge()
                            ->separator(',')
                            ->placeholder('Nenhuma tag'),
                    ])
                    ->columns(3),

                Infolists\Components\Section::make('Estatísticas')
                    ->schema([
                        Infolists\Components\TextEntry::make('view_count')
                            ->label('Visualizações'),

                        Infolists\Components\TextEntry::make('click_count')
                            ->label('Cliques'),

                        Infolists\Components\TextEntry::make('conversion_count')
                            ->label('Conversões'),

                        Infolists\Components\TextEntry::make('highlight_expires_at')
                            ->label('Destaque Expira')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('Não está em destaque'),
                    ])
                    ->columns(4),

                Infolists\Components\Section::make('Imagens')
                    ->schema([
                        Infolists\Components\ImageEntry::make('cover_image')
                            ->label('Capa')
                            ->getStateUsing(fn (Service $record) => $record->getFirstMediaUrl('cover'))
                            ->height(200),

                        Infolists\Components\RepeatableEntry::make('gallery_images')
                            ->label('Galeria')
                            ->getStateUsing(fn (Service $record) => $record->getMedia('gallery')->map(fn ($media) => [
                                'url' => $media->getUrl(),
                            ])->toArray())
                            ->schema([
                                Infolists\Components\ImageEntry::make('url')
                                    ->hiddenLabel()
                                    ->height(150),
                            ])
                            ->columns(5)
                            ->columnSpanFull(),
                    ])
                    ->columns(1),

                Infolists\Components\Section::make('Timestamps')
                    ->schema([
                        Infolists\Components\TextEntry::make('created_at')
                            ->label('Criado em')
                            ->dateTime('d/m/Y H:i'),

                        Infolists\Components\TextEntry::make('updated_at')
                            ->label('Actualizado em')
                            ->dateTime('d/m/Y H:i'),
                    ])
                    ->columns(2)
                    ->collapsed(),
            ]);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListServices::route('/'),
            'view' => Pages\ViewService::route('/{record}'),
        ];
    }
}
