<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\AuditLog;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Validation\Rules\Password;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Gestão de Utilizadores';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'utilizador';

    protected static ?string $pluralModelLabel = 'utilizadores';

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')->label('Nome')->required()->maxLength(120),
            Forms\Components\TextInput::make('email')->label('E-mail')->email()->required()->maxLength(150)->unique(ignoreRecord: true),
            Forms\Components\TextInput::make('phone')->label('Telefone')->tel()->maxLength(30),
            Forms\Components\Select::make('role')->label('Papel')->required()->native(false)
                // Técnicos registam-se sozinhos (com KYC); aqui só se criam administradores e clientes.
                ->options(fn (string $operation) => $operation === 'create'
                    ? ['admin' => 'Administrador', 'cliente' => 'Cliente']
                    : ['admin' => 'Administrador', 'tecnico' => 'Técnico', 'cliente' => 'Cliente'])
                ->default('cliente')
                ->disabled(fn (?User $record) => $record?->id === auth()->id())
                ->helperText(fn (?User $record) => $record?->id === auth()->id() ? 'Não pode retirar o seu próprio papel de administrador.' : null),
            Forms\Components\TextInput::make('password')->label('Palavra-passe')->password()->revealable()
                ->required(fn (string $operation) => $operation === 'create')
                ->rule(Password::min(8)->letters()->numbers())
                ->dehydrated(fn (?string $state) => filled($state))
                ->helperText(fn (string $operation) => $operation === 'edit' ? 'Deixe em branco para manter a actual.' : 'Mínimo de 8 caracteres, com letras e números.'),
            Forms\Components\Toggle::make('active')->label('Conta activa')->default(true)
                ->disabled(fn (?User $record) => $record?->id === auth()->id()),
        ])->columns(2);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->defaultSort('name')
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Utilizador')->searchable()->sortable()->weight('bold')
                    ->description(fn (User $record) => $record->email),
                Tables\Columns\TextColumn::make('phone')->label('Telefone')->searchable()->placeholder('—'),
                Tables\Columns\TextColumn::make('role')->label('Papel')->badge()
                    ->formatStateUsing(fn (string $state) => ['admin' => 'Administrador', 'tecnico' => 'Técnico', 'cliente' => 'Cliente'][$state] ?? $state)
                    ->color(fn (string $state) => ['admin' => 'danger', 'tecnico' => 'info', 'cliente' => 'gray'][$state] ?? 'gray'),
                Tables\Columns\IconColumn::make('active')->label('Activo')->boolean(),
                Tables\Columns\TextColumn::make('created_at')->label('Registo')->date('d/m/Y')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('role')->label('Papel')
                    ->options(['admin' => 'Administrador', 'tecnico' => 'Técnico', 'cliente' => 'Cliente']),
                Tables\Filters\TernaryFilter::make('active')->label('Activo'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\Action::make('toggle')
                    ->label(fn (User $record) => $record->active ? 'Desactivar' : 'Activar')
                    ->icon(fn (User $record) => $record->active ? 'heroicon-o-no-symbol' : 'heroicon-o-check-circle')
                    ->color(fn (User $record) => $record->active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->hidden(fn (User $record) => $record->id === auth()->id())
                    ->action(function (User $record) {
                        $record->update(['active' => ! $record->active]);
                        AuditLog::record('utilizador_estado', "{$record->name} → ".($record->active ? 'activo' : 'desactivado'));
                        Notification::make()->success()->title($record->active ? 'Conta activada.' : 'Conta desactivada.')->send();
                    }),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'create' => Pages\CreateUser::route('/create'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
