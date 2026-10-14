<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Filament\Resources\UserResource\RelationManagers;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Gestão de Utilizadores';

    protected static ?string $navigationLabel = 'Utilizadores';

    protected static ?string $modelLabel = 'Utilizador';

    protected static ?string $pluralModelLabel = 'Utilizadores';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informações Básicas')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nome')
                            ->required()
                            ->maxLength(255),
                        Forms\Components\TextInput::make('email')
                            ->label('E-mail')
                            ->email()
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255),
                        Forms\Components\Select::make('type')
                            ->label('Tipo')
                            ->options([
                                User::TYPE_ADMIN => 'Administrador',
                                User::TYPE_CLIENT => 'Cliente',
                                User::TYPE_PROVIDER => 'Prestador de Serviço',
                            ])
                            ->required()
                            ->default(User::TYPE_CLIENT),
                        Forms\Components\TextInput::make('phone')
                            ->label('Telefone')
                            ->tel()
                            ->mask('(99) 99999-9999')
                            ->maxLength(255),
                    ])->columns(2),

                Forms\Components\Section::make('Foto e Biografia')
                    ->schema([
                        Forms\Components\FileUpload::make('avatar')
                            ->label('Foto')
                            ->image()
                            ->avatar()
                            ->directory('avatars')
                            ->maxSize(2048),
                        Forms\Components\Textarea::make('bio')
                            ->label('Biografia')
                            ->rows(3)
                            ->maxLength(1000),
                    ])->columns(2),

                Forms\Components\Section::make('Morada')
                    ->schema([
                        Forms\Components\TextInput::make('address')
                            ->label('Morada')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('city')
                            ->label('Cidade')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('state')
                            ->label('Província')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('postal_code')
                            ->label('Código Postal')
                            ->maxLength(255),
                        Forms\Components\TextInput::make('country')
                            ->label('País')
                            ->default('Angola')
                            ->maxLength(255),
                    ])->columns(3),

                Forms\Components\Section::make('Segurança')
                    ->schema([
                        Forms\Components\TextInput::make('password')
                            ->label('Palavra-passe')
                            ->password()
                            ->dehydrateStateUsing(fn ($state) => !empty($state) ? Hash::make($state) : null)
                            ->dehydrated(fn ($state) => filled($state))
                            ->required(fn (string $operation): bool => $operation === 'create')
                            ->minLength(8)
                            ->maxLength(255),
                        Forms\Components\Toggle::make('is_active')
                            ->label('Utilizador Activo')
                            ->default(true),
                        Forms\Components\DateTimePicker::make('email_verified_at')
                            ->label('E-mail Verificado em'),
                    ])->columns(3),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('avatar')
                    ->label('Foto')
                    ->circular()
                    ->defaultImageUrl(fn ($record) => 'https://ui-avatars.com/api/?name=' . urlencode($record->name) . '&color=7F9CF5&background=EBF4FF'),
                Tables\Columns\TextColumn::make('name')
                    ->label('Nome')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\TextColumn::make('email')
                    ->label('E-mail')
                    ->searchable()
                    ->sortable(),
                Tables\Columns\BadgeColumn::make('type')
                    ->label('Tipo')
                    ->colors([
                        'danger' => User::TYPE_ADMIN,
                        'success' => User::TYPE_PROVIDER,
                        'primary' => User::TYPE_CLIENT,
                    ])
                    ->formatStateUsing(fn (string $state): string => match($state) {
                        User::TYPE_ADMIN => 'Admin',
                        User::TYPE_CLIENT => 'Cliente',
                        User::TYPE_PROVIDER => 'Prestador',
                        default => $state,
                    }),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Telefone')
                    ->searchable()
                    ->toggleable(),
                Tables\Columns\TextColumn::make('city')
                    ->label('Cidade')
                    ->searchable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Activo')
                    ->boolean(),
                Tables\Columns\IconColumn::make('email_verified_at')
                    ->label('Verificado')
                    ->boolean()
                    ->getStateUsing(fn ($record) => $record->email_verified_at !== null),
                Tables\Columns\TextColumn::make('last_login_at')
                    ->label('Último Login')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Criado em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('type')
                    ->label('Tipo')
                    ->options([
                        User::TYPE_ADMIN => 'Administrador',
                        User::TYPE_CLIENT => 'Cliente',
                        User::TYPE_PROVIDER => 'Prestador',
                    ]),
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Estado')
                    ->placeholder('Todos')
                    ->trueLabel('Activos')
                    ->falseLabel('Inactivos'),
                Tables\Filters\TernaryFilter::make('email_verified_at')
                    ->label('E-mail Verificado')
                    ->placeholder('Todos')
                    ->trueLabel('Verificados')
                    ->falseLabel('Não Verificados')
                    ->queries(
                        true: fn (Builder $query) => $query->whereNotNull('email_verified_at'),
                        false: fn (Builder $query) => $query->whereNull('email_verified_at'),
                    ),
            ])
            ->actions([
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
            RelationManagers\ServiceProviderRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'view' => Pages\ViewUser::route('/{record}'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }
}
