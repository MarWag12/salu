<?php

namespace App\Filament\Resources;

use App\Enums\KycStatus;
use App\Filament\Resources\KycVerificationResource\Pages;
use App\Filament\Resources\KycVerificationResource\RelationManagers;
use App\Models\KycVerification;
use App\Services\KycService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Infolists;
use Filament\Infolists\Infolist;
use Filament\Notifications\Notification;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class KycVerificationResource extends Resource
{
    protected static ?string $model = KycVerification::class;

    protected static ?string $navigationIcon = 'heroicon-o-identification';

    protected static ?string $navigationLabel = 'Verificações KYC';

    protected static ?string $modelLabel = 'Verificação KYC';

    protected static ?string $pluralModelLabel = 'Verificações KYC';

    protected static ?string $navigationGroup = 'Gestão de Prestadores';

    protected static ?int $navigationSort = 1;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::pending()->count() ?: null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Informações da Verificação')
                    ->schema([
                        Forms\Components\Select::make('status')
                            ->label('Estado')
                            ->options(collect(KycStatus::cases())->mapWithKeys(fn ($status) => [$status->value => $status->label()]))
                            ->disabled(),

                        Forms\Components\Textarea::make('rejection_reason')
                            ->label('Motivo da Rejeição')
                            ->disabled()
                            ->columnSpanFull(),
                    ])
                    ->columns(2),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('serviceProvider.user.name')
                    ->label('Prestador')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('serviceProvider.user.email')
                    ->label('Email')
                    ->searchable(),

                Tables\Columns\TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (KycStatus $state) => $state->label())
                    ->color(fn (KycStatus $state) => $state->color()),

                Tables\Columns\TextColumn::make('ai_verification_status')
                    ->label('AI Status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state) => match ($state) {
                        'passed' => 'Passou',
                        'failed' => 'Falhou',
                        'error' => 'Erro',
                        'pending' => 'Pendente',
                        default => '—',
                    })
                    ->color(fn (?string $state) => match ($state) {
                        'passed' => 'success',
                        'failed' => 'danger',
                        'error' => 'warning',
                        'pending' => 'gray',
                        default => 'gray',
                    })
                    ->tooltip(function ($record) {
                        if (!$record->ai_face_match_score) {
                            return null;
                        }
                        return sprintf(
                            'Face: %.1f%% | Liveness: %.1f%%',
                            $record->ai_face_match_score ?? 0,
                            $record->ai_liveness_score ?? 0
                        );
                    })
                    ->toggleable(),

                Tables\Columns\TextColumn::make('documents_count')
                    ->label('Documentos')
                    ->counts('documents')
                    ->alignCenter(),

                Tables\Columns\TextColumn::make('reviewer.name')
                    ->label('Revisto por')
                    ->placeholder('Não revisto'),

                Tables\Columns\TextColumn::make('reviewed_at')
                    ->label('Revisto em')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('—'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Submetido em')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->label('Estado')
                    ->options(collect(KycStatus::cases())->mapWithKeys(fn ($status) => [$status->value => $status->label()])),
            ])
            ->actions([
                Tables\Actions\ViewAction::make(),

                Tables\Actions\Action::make('approve')
                    ->label('Aprovar')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Aprovar Verificação KYC')
                    ->modalDescription('Tem certeza que deseja aprovar esta verificação? O prestador poderá publicar serviços.')
                    ->visible(fn (KycVerification $record) => in_array($record->status, [KycStatus::PENDING, KycStatus::RESUBMIT]))
                    ->action(function (KycVerification $record) {
                        $service = app(KycService::class);
                        $service->approve($record, auth()->user());

                        Notification::make()
                            ->title('Verificação aprovada')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('reject')
                    ->label('Reprovar')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->form([
                        Forms\Components\Textarea::make('reason')
                            ->label('Motivo da Rejeição')
                            ->required()
                            ->minLength(10)
                            ->placeholder('Explique o motivo da rejeição...'),
                    ])
                    ->visible(fn (KycVerification $record) => in_array($record->status, [KycStatus::PENDING, KycStatus::RESUBMIT]))
                    ->action(function (KycVerification $record, array $data) {
                        $service = app(KycService::class);
                        $service->reject($record, auth()->user(), $data['reason']);

                        Notification::make()
                            ->title('Verificação reprovada')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\Action::make('request_resubmit')
                    ->label('Pedir Reenvio')
                    ->icon('heroicon-o-arrow-path')
                    ->color('info')
                    ->form([
                        Forms\Components\Textarea::make('reason')
                            ->label('Motivo do Pedido')
                            ->required()
                            ->minLength(10)
                            ->placeholder('Explique o que precisa ser corrigido...'),
                    ])
                    ->visible(fn (KycVerification $record) => $record->status === KycStatus::PENDING)
                    ->action(function (KycVerification $record, array $data) {
                        $service = app(KycService::class);
                        $service->requestResubmit($record, auth()->user(), $data['reason']);

                        Notification::make()
                            ->title('Pedido de reenvio enviado')
                            ->success()
                            ->send();
                    }),
            ])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc')
            ->modifyQueryUsing(fn (Builder $query) => $query->with(['serviceProvider.user', 'reviewer', 'documents']));
    }

    public static function infolist(Infolist $infolist): Infolist
    {
        return $infolist
            ->schema([
                Infolists\Components\Section::make('Informações do Prestador')
                    ->schema([
                        Infolists\Components\TextEntry::make('serviceProvider.user.name')
                            ->label('Nome'),
                        Infolists\Components\TextEntry::make('serviceProvider.user.email')
                            ->label('Email'),
                        Infolists\Components\TextEntry::make('serviceProvider.document_type_label')
                            ->label('Tipo de Documento'),
                        Infolists\Components\TextEntry::make('serviceProvider.formatted_document')
                            ->label('Número do Documento'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Estado da Verificação')
                    ->schema([
                        Infolists\Components\TextEntry::make('status')
                            ->label('Estado')
                            ->badge()
                            ->formatStateUsing(fn (KycStatus $state) => $state->label())
                            ->color(fn (KycStatus $state) => $state->color()),
                        Infolists\Components\TextEntry::make('rejection_reason')
                            ->label('Motivo')
                            ->placeholder('—')
                            ->columnSpanFull(),
                        Infolists\Components\TextEntry::make('reviewer.name')
                            ->label('Revisto por')
                            ->placeholder('Não revisto'),
                        Infolists\Components\TextEntry::make('reviewed_at')
                            ->label('Revisto em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('—'),
                    ])
                    ->columns(2),

                Infolists\Components\Section::make('Verificação AI (AWS Rekognition)')
                    ->schema([
                        Infolists\Components\TextEntry::make('ai_verification_status')
                            ->label('Estado da Verificação AI')
                            ->badge()
                            ->formatStateUsing(fn (?string $state) => match ($state) {
                                'passed' => '✅ Passou',
                                'failed' => '❌ Falhou',
                                'error' => '⚠️ Erro',
                                'pending' => '⏳ Pendente',
                                default => '—',
                            })
                            ->color(fn (?string $state) => match ($state) {
                                'passed' => 'success',
                                'failed' => 'danger',
                                'error' => 'warning',
                                'pending' => 'gray',
                                default => 'gray',
                            }),
                        Infolists\Components\TextEntry::make('ai_verified_at')
                            ->label('Verificado em')
                            ->dateTime('d/m/Y H:i')
                            ->placeholder('Não verificado'),
                        Infolists\Components\TextEntry::make('ai_face_match_score')
                            ->label('Score de Correspondência Facial')
                            ->formatStateUsing(fn (?float $state) => $state ? sprintf('%.2f%%', $state) : '—')
                            ->badge()
                            ->color(fn (?float $state) => match (true) {
                                $state === null => 'gray',
                                $state >= 90 => 'success',
                                $state >= 80 => 'warning',
                                default => 'danger',
                            }),
                        Infolists\Components\TextEntry::make('ai_liveness_score')
                            ->label('Score de Detecção de Vida')
                            ->formatStateUsing(fn (?float $state) => $state ? sprintf('%.2f%%', $state) : '—')
                            ->badge()
                            ->color(fn (?float $state) => match (true) {
                                $state === null => 'gray',
                                $state >= 90 => 'success',
                                $state >= 75 => 'warning',
                                default => 'danger',
                            }),
                    ])
                    ->columns(2)
                    ->visible(fn ($record) => config('services.ai_verification.enabled', false) && $record->ai_verified_at !== null),

                Infolists\Components\Section::make('Documentos Submetidos')
                    ->schema([
                        Infolists\Components\RepeatableEntry::make('documents')
                            ->label('')
                            ->schema([
                                Infolists\Components\TextEntry::make('type')
                                    ->label('Tipo')
                                    ->formatStateUsing(fn (string $state) => match ($state) {
                                        'identity_document' => 'Documento de Identidade (BI)',
                                        'selfie' => 'Selfie com Documento',
                                        default => $state,
                                    })
                                    ->badge()
                                    ->color(fn (string $state) => match ($state) {
                                        'identity_document' => 'info',
                                        'selfie' => 'success',
                                        default => 'gray',
                                    }),
                                Infolists\Components\TextEntry::make('original_filename')
                                    ->label('Nome do Ficheiro'),
                                Infolists\Components\ViewEntry::make('document_image')
                                    ->label('Imagem do Documento')
                                    ->view('filament.infolists.components.kyc-document-image')
                                    ->getStateUsing(fn ($record) => $record->getFirstMediaUrl('document')),
                            ])
                            ->columns(1)
                            ->grid(2),
                    ]),
            ]);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\StatusHistoryRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListKycVerifications::route('/'),
            'view' => Pages\ViewKycVerification::route('/{record}'),
        ];
    }
}
