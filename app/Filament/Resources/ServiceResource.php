<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ServiceResource\Pages;
use App\Models\Service;
use App\Support\Format;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ServiceResource extends Resource
{
    protected static ?string $model = Service::class;

    protected static ?string $navigationIcon = 'heroicon-o-briefcase';

    protected static ?string $navigationGroup = 'Gestão de Serviços';

    protected static ?int $navigationSort = 2;

    protected static ?string $modelLabel = 'serviço';

    protected static ?string $pluralModelLabel = 'serviços';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Serviço')->schema([
                Forms\Components\Select::make('category_id')->label('Categoria')->required()
                    ->relationship('category', 'name')->searchable()->preload(),
                Forms\Components\TextInput::make('name')->label('Nome')->required()->maxLength(150),
                Forms\Components\Textarea::make('description')->label('Descrição')->rows(4)->maxLength(3000)->columnSpanFull(),
                Forms\Components\TextInput::make('base_price')->label('Preço base')->required()->numeric()
                    ->minValue(0)->maxValue(99999999)->prefix('AOA'),
                Forms\Components\TextInput::make('duration_minutes')->label('Duração (minutos)')->required()->numeric()
                    ->integer()->minValue(15)->maxValue(10080)->default(60),
            ])->columns(2),

            Forms\Components\Section::make('Imagem e visibilidade')->schema([
                // Spatie Media Library: colecção "image" (miniatura "card" gerada automaticamente).
                \Filament\Forms\Components\SpatieMediaLibraryFileUpload::make('image')->label('Imagem')
                    ->collection('image')->image()->maxSize(4096)->imageEditor()->columnSpanFull(),
                Forms\Components\Toggle::make('featured')->label('Em destaque na página inicial'),
                Forms\Components\Toggle::make('active')->label('Publicado')->default(true),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with('category')->withCount('requests'))
            ->defaultSort('name')
            ->columns([
                \Filament\Tables\Columns\SpatieMediaLibraryImageColumn::make('image')->label('')->collection('image')->conversion('card')->circular(),
                Tables\Columns\TextColumn::make('name')->label('Serviço')->searchable()->sortable()->weight('bold'),
                Tables\Columns\TextColumn::make('category.name')->label('Categoria')->badge()->sortable(),
                Tables\Columns\TextColumn::make('base_price')->label('Preço base')->sortable()->formatStateUsing(fn ($state) => Format::aoa($state)),
                Tables\Columns\TextColumn::make('duration_minutes')->label('Duração')->formatStateUsing(fn ($state, Service $record) => $record->durationLabel()),
                Tables\Columns\TextColumn::make('requests_count')->label('Pedidos')->sortable(),
                Tables\Columns\ToggleColumn::make('featured')->label('Destaque'),
                Tables\Columns\ToggleColumn::make('active')->label('Publicado'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('category_id')->label('Categoria')->relationship('category', 'name'),
                Tables\Filters\TernaryFilter::make('active')->label('Publicado'),
                Tables\Filters\TernaryFilter::make('featured')->label('Destaque'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                // Serviços com pedidos não se eliminam: despublique-os.
                Tables\Actions\DeleteAction::make()->hidden(fn (Service $record) => $record->requests()->exists()),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListServices::route('/'),
            'create' => Pages\CreateService::route('/create'),
            'edit' => Pages\EditService::route('/{record}/edit'),
        ];
    }
}
