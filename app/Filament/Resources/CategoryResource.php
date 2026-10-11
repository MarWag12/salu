<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CategoryResource\Pages;
use App\Models\Category;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

class CategoryResource extends Resource
{
    protected static ?string $model = Category::class;

    protected static ?string $navigationIcon = 'heroicon-o-tag';

    protected static ?string $navigationGroup = 'Gestão de Serviços';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'categoria';

    protected static ?string $pluralModelLabel = 'categorias';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->label('Nome')->required()->maxLength(100)
                ->unique(ignoreRecord: true),
            Forms\Components\Select::make('icon')->label('Ícone')->required()->searchable()
                ->options(Category::ICONS)->default('ti-tools')
                ->helperText('O ícone aparece nos cartões do site público.'),
            Forms\Components\Textarea::make('description')->label('Descrição')->rows(3)->maxLength(500)->columnSpanFull(),
            Forms\Components\Toggle::make('active')->label('Activa')->default(true),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->withCount('services'))
            ->defaultSort('name')
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Nome')->searchable()->sortable()->weight('bold'),
                Tables\Columns\TextColumn::make('icon')->label('Ícone')->formatStateUsing(fn (string $state) => Category::ICONS[$state] ?? $state)->badge()->color('gray'),
                Tables\Columns\TextColumn::make('services_count')->label('Serviços')->sortable(),
                Tables\Columns\ToggleColumn::make('active')->label('Activa'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                // Só se pode eliminar uma categoria sem serviços; caso contrário, desactive-a.
                Tables\Actions\DeleteAction::make()->hidden(fn (Category $record) => $record->services()->exists()),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCategories::route('/'),
            'create' => Pages\CreateCategory::route('/create'),
            'edit' => Pages\EditCategory::route('/{record}/edit'),
        ];
    }
}
