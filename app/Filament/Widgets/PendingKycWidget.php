<?php

namespace App\Filament\Widgets;

use App\Enums\KycStatus;
use App\Models\KycVerification;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class PendingKycWidget extends BaseWidget
{
    protected static ?int $sort = 2;

    protected int | string | array $columnSpan = 'full';

    protected static ?string $heading = 'Verificações KYC Pendentes';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                KycVerification::query()
                    ->where('status', KycStatus::PENDING)
                    ->with('serviceProvider.user')
                    ->latest()
            )
            ->columns([
                Tables\Columns\TextColumn::make('serviceProvider.user.name')
                    ->label('Prestador')
                    ->searchable(),

                Tables\Columns\TextColumn::make('serviceProvider.user.email')
                    ->label('Email'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Submetido')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->actions([
                Tables\Actions\Action::make('view')
                    ->label('Ver')
                    ->url(fn (KycVerification $record) => route('filament.admin.resources.kyc-verifications.view', $record))
                    ->icon('heroicon-o-eye'),
            ])
            ->paginated([5]);
    }
}
