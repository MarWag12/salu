<?php

namespace App\Filament\Resources;

use App\Filament\Resources\TechnicianResource\Pages;
use App\Models\AuditLog;
use App\Models\Technician;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/** Técnicos + verificação KYC (aprovar / rejeitar com motivo, ver documento). */
class TechnicianResource extends Resource
{
    protected static ?string $model = Technician::class;

    protected static ?string $navigationIcon = 'heroicon-o-identification';

    protected static ?string $navigationGroup = 'Gestão de Técnicos';

    protected static ?int $navigationSort = 1;

    protected static ?string $modelLabel = 'técnico';

    protected static ?string $pluralModelLabel = 'técnicos e KYC';

    protected static ?string $navigationLabel = 'Técnicos e KYC';

    public static function getNavigationBadge(): ?string
    {
        $n = Technician::where('kyc_status', Technician::KYC_PENDENTE)->count();

        return $n ? (string) $n : null;
    }

    public static function getNavigationBadgeColor(): string|array|null
    {
        return 'warning';
    }

    public static function canCreate(): bool
    {
        return false; // Os técnicos criam a conta no site (registo) e submetem o KYC.
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Perfil')->schema([
                Forms\Components\Placeholder::make('tech_name')->label('Técnico')
                    ->content(fn (?Technician $record) => $record ? $record->user->name.' — '.$record->user->email : ''),
                Forms\Components\TextInput::make('municipality')->label('Município')->maxLength(120),
                Forms\Components\TextInput::make('experience_years')->label('Anos de experiência')->numeric()->integer()->minValue(0)->maxValue(60),
                Forms\Components\Toggle::make('available')->label('Disponível para pedidos'),
                Forms\Components\Select::make('categories')->label('Especialidades')->multiple()->preload()
                    ->relationship('categories', 'name')->columnSpanFull(),
                Forms\Components\Textarea::make('bio')->label('Apresentação')->rows(3)->maxLength(1500)->columnSpanFull(),
            ])->columns(3),

            Forms\Components\Section::make('Verificação KYC')->schema([
                Forms\Components\Select::make('kyc_status')->label('Estado')->native(false)->options(Technician::KYC_STATUSES)->required(),
                Forms\Components\TextInput::make('kyc_notes')->label('Notas / motivo da rejeição')->maxLength(255),
                Forms\Components\Placeholder::make('kyc_doc')->label('Documento submetido')
                    ->content(fn (?Technician $record) => $record?->hasKycDocument()
                        ? new \Illuminate\Support\HtmlString('<a href="'.e($record->kycDocumentUrl()).'" target="_blank" rel="noopener" style="color:#1e88e5;font-weight:600">Abrir documento</a>')
                        : 'Não submetido'),
            ])->columns(3),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['user', 'categories'])->withCount('requests'))
            ->defaultSort('created_at', 'desc')
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Técnico')->searchable()->weight('bold')
                    ->description(fn (Technician $record) => $record->user->email),
                Tables\Columns\TextColumn::make('municipality')->label('Município')->placeholder('—'),
                Tables\Columns\TextColumn::make('categories.name')->label('Especialidades')->badge()->color('info'),
                Tables\Columns\TextColumn::make('kyc_status')->label('KYC')->badge()
                    ->formatStateUsing(fn (string $state) => Technician::KYC_STATUSES[$state] ?? $state)
                    ->color(fn (string $state) => ['pendente' => 'warning', 'aprovado' => 'success', 'rejeitado' => 'danger'][$state] ?? 'gray'),
                Tables\Columns\IconColumn::make('has_document')->label('Documento')->boolean()
                    ->state(fn (Technician $record) => $record->hasKycDocument()),
                Tables\Columns\TextColumn::make('rating_avg')->label('Avaliação')->sortable()
                    ->formatStateUsing(fn ($state, Technician $record) => number_format((float) $state, 1, ',', '').' ★ ('.$record->reviews_count.')'),
                Tables\Columns\TextColumn::make('requests_count')->label('Pedidos')->sortable(),
                Tables\Columns\IconColumn::make('available')->label('Disponível')->boolean(),
                Tables\Columns\TextColumn::make('created_at')->label('Registo')->date('d/m/Y')->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('categories')->label('Especialidade')->relationship('categories', 'name'),
            ])
            ->actions([
                Tables\Actions\Action::make('document')->label('Documento')->icon('heroicon-o-document-text')->color('gray')
                    ->url(fn (Technician $record) => $record->kycDocumentUrl(), shouldOpenInNewTab: true)
                    ->visible(fn (Technician $record) => $record->hasKycDocument()),
                Tables\Actions\Action::make('approve')->label('Aprovar')->icon('heroicon-o-check-circle')->color('success')
                    ->requiresConfirmation()->modalHeading('Aprovar técnico')->modalDescription('O técnico passa a poder aceitar pedidos.')
                    ->visible(fn (Technician $record) => $record->kyc_status !== Technician::KYC_APROVADO)
                    ->action(function (Technician $record) {
                        $record->update(['kyc_status' => Technician::KYC_APROVADO, 'kyc_notes' => null]);
                        AuditLog::record('kyc_aprovado', "KYC aprovado: {$record->user->name}");
                        Notification::make()->success()->title('Técnico aprovado.')->send();
                    }),
                Tables\Actions\Action::make('reject')->label('Rejeitar')->icon('heroicon-o-x-circle')->color('danger')
                    ->modalHeading('Rejeitar verificação')
                    ->form([Forms\Components\Textarea::make('kyc_notes')->label('Motivo da rejeição')->required()->maxLength(255)->rows(3)])
                    ->visible(fn (Technician $record) => $record->kyc_status !== Technician::KYC_REJEITADO)
                    ->action(function (Technician $record, array $data) {
                        $record->update(['kyc_status' => Technician::KYC_REJEITADO, 'kyc_notes' => $data['kyc_notes']]);
                        AuditLog::record('kyc_rejeitado', "KYC rejeitado: {$record->user->name} ({$data['kyc_notes']})");
                        Notification::make()->success()->title('Verificação rejeitada.')->send();
                    }),
                Tables\Actions\EditAction::make()->label('Editar')->iconButton(),
            ])
            ->bulkActions([]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTechnicians::route('/'),
            'edit' => Pages\EditTechnician::route('/{record}/edit'),
        ];
    }
}
