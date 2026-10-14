<?php

namespace App\Filament\Resources\UserResource\RelationManagers;

use App\Models\ServiceProvider;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables;
use Filament\Tables\Table;

class ServiceProviderRelationManager extends RelationManager
{
    protected static string $relationship = 'serviceProvider';

    protected static ?string $title = 'Perfil de Prestador';

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Dados da Empresa')
                    ->schema([
                        Forms\Components\TextInput::make('company_name')
                            ->label('Razão Social')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('trading_name')
                            ->label('Nome Fantasia')
                            ->maxLength(255),
                        Forms\Components\Select::make('document_type')
                            ->label('Tipo de Documento')
                            ->options([
                                ServiceProvider::DOCUMENT_CPF => 'CPF',
                                ServiceProvider::DOCUMENT_CNPJ => 'CNPJ',
                            ])
                            ->required()
                            ->default(ServiceProvider::DOCUMENT_CPF),
                        Forms\Components\TextInput::make('document_number')
                            ->label('Número do Documento')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(18),
                    ])->columns(2),

                Forms\Components\Section::make('Descrição')
                    ->schema([
                        Forms\Components\Textarea::make('description')
                            ->label('Descrição dos Serviços')
                            ->rows(4)
                            ->maxLength(2000),
                    ]),

                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_verified')
                            ->label('Verificado'),
                        Forms\Components\Toggle::make('is_featured')
                            ->label('Destaque'),
                        Forms\Components\DateTimePicker::make('verified_at')
                            ->label('Verificado em'),
                    ])->columns(3),
            ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('company_name')
            ->columns([
                Tables\Columns\TextColumn::make('display_name')
                    ->label('Nome'),
                Tables\Columns\TextColumn::make('formatted_document')
                    ->label('Documento'),
                Tables\Columns\TextColumn::make('rating')
                    ->label('Avaliação')
                    ->formatStateUsing(fn ($state) => number_format($state, 1) . ' ★'),
                Tables\Columns\TextColumn::make('completed_services')
                    ->label('Serviços'),
                Tables\Columns\IconColumn::make('is_verified')
                    ->label('Verificado')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Destaque')
                    ->boolean(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                Tables\Actions\CreateAction::make(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
