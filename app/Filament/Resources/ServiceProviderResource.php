<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ServiceProviderResource\Pages;
use App\Models\ServiceProvider;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ServiceProviderResource extends Resource
{
    protected static ?string $model = ServiceProvider::class;

    protected static ?string $navigationIcon = 'heroicon-o-briefcase';

    protected static ?string $navigationGroup = 'Gestão de Utilizadores';

    protected static ?string $navigationLabel = 'Prestadores';

    protected static ?string $modelLabel = 'Prestador de Serviço';

    protected static ?string $pluralModelLabel = 'Prestadores de Serviço';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Utilizador')
                    ->schema([
                        Forms\Components\Select::make('user_id')
                            ->label('Utilizador')
                            ->relationship('user', 'name', fn (Builder $query) => $query->where('type', User::TYPE_PROVIDER))
                            ->searchable()
                            ->preload()
                            ->required()
                            ->createOptionForm([
                                Forms\Components\TextInput::make('name')
                                    ->label('Nome')
                                    ->required(),
                                Forms\Components\TextInput::make('email')
                                    ->label('E-mail')
                                    ->email()
                                    ->required()
                                    ->unique('users', 'email'),
                                Forms\Components\TextInput::make('password')
                                    ->label('Palavra-passe')
                                    ->password()
                                    ->required()
                                    ->minLength(8),
                                Forms\Components\Hidden::make('type')
                                    ->default(User::TYPE_PROVIDER),
                            ]),
                    ]),

                Forms\Components\Section::make('Dados da Empresa')
                    ->schema([
                        Forms\Components\TextInput::make('company_name')
                            ->label('Denominação Social')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('trading_name')
                            ->label('Nome Comercial')
                            ->maxLength(255),
                        Forms\Components\Select::make('document_type')
                            ->label('Tipo de Documento')
                            ->options([
                                ServiceProvider::DOCUMENT_CPF => 'BI',
                                ServiceProvider::DOCUMENT_CNPJ => 'NIF',
                            ])
                            ->required()
                            ->default(ServiceProvider::DOCUMENT_CPF)
                            ->live(),
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
                            ->maxLength(2000)
                            ->columnSpanFull(),
                    ]),

                Forms\Components\Section::make('Estatísticas')
                    ->schema([
                        Forms\Components\TextInput::make('rating')
                            ->label('Avaliação')
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(5)
                            ->step(0.1)
                            ->disabled(),
                        Forms\Components\TextInput::make('total_reviews')
                            ->label('Total de Avaliações')
                            ->numeric()
                            ->default(0)
                            ->disabled(),
                        Forms\Components\TextInput::make('completed_services')
                            ->label('Serviços Completados')
                            ->numeric()
                            ->default(0)
                            ->disabled(),
                    ])->columns(3),

                Forms\Components\Section::make('Status')
                    ->schema([
                        Forms\Components\Toggle::make('is_verified')
                            ->label('Verificado')
                            ->helperText('Marque se o prestador foi verificado pela plataforma'),
                        Forms\Components\Toggle::make('is_featured')
                            ->label('Destaque')
                            ->helperText('Marque para destacar este prestador na plataforma'),
                        Forms\Components\DateTimePicker::make('verified_at')
                            ->label('Data de Verificação'),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('user.avatar')
                    ->label('Foto')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => 'https://ui-avatars.com/api/?name=' . urlencode($record->user->name ?? 'SP') . '&color=7F9CF5&background=EBF4FF'),
                Tables\Columns\TextColumn::make('display_name')
                    ->label('Nome')
                    ->searchable(['company_name', 'trading_name'])
                    ->sortable(),
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Responsável')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('formatted_document')
                    ->label('Documento')
                    ->searchable('document_number'),
                Tables\Columns\TextColumn::make('rating')
                    ->label('Avaliação')
                    ->formatStateUsing(fn ($state) => number_format($state, 1) . ' ★')
                    ->sortable()
                    ->color(fn ($state) => $state >= 4 ? 'success' : ($state >= 3 ? 'warning' : 'danger')),
                Tables\Columns\TextColumn::make('total_reviews')
                    ->label('Avaliações')
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('completed_services')
                    ->label('Serviços')
                    ->sortable()
                    ->toggleable(),
                Tables\Columns\IconColumn::make('is_verified')
                    ->label('Verificado')
                    ->boolean(),
                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Destaque')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_verified')
                    ->label('Verificação')
                    ->placeholder('Todos')
                    ->trueLabel('Verificados')
                    ->falseLabel('Não Verificados'),
                Tables\Filters\TernaryFilter::make('is_featured')
                    ->label('Destaque')
                    ->placeholder('Todos')
                    ->trueLabel('Em Destaque')
                    ->falseLabel('Normal'),
                Tables\Filters\SelectFilter::make('document_type')
                    ->label('Tipo de Documento')
                    ->options([
                        ServiceProvider::DOCUMENT_CPF => 'BI',
                        ServiceProvider::DOCUMENT_CNPJ => 'NIF',
                    ]),
            ])
            ->actions([
                Tables\Actions\Action::make('verify')
                    ->label('Verificar')
                    ->icon('heroicon-o-check-badge')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(fn (ServiceProvider $record) => $record->update([
                        'is_verified' => true,
                        'verified_at' => now(),
                    ]))
                    ->visible(fn (ServiceProvider $record) => !$record->is_verified),
                Tables\Actions\ViewAction::make(),
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
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
            'index' => Pages\ListServiceProviders::route('/'),
            'create' => Pages\CreateServiceProvider::route('/create'),
            'view' => Pages\ViewServiceProvider::route('/{record}'),
            'edit' => Pages\EditServiceProvider::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }
}
