<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\TechnicianResource;
use App\Models\Technician;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;

class PendingKycTable extends TableWidget
{
    protected static ?int $sort = 3;

    protected static ?string $heading = 'Verificações KYC pendentes';

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(Technician::query()->where('kyc_status', Technician::KYC_PENDENTE)->with('user')->latest())
            ->paginated([5])
            ->emptyStateHeading('Sem verificações KYC pendentes')
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Técnico')->description(fn (Technician $record) => $record->user->email)->weight('bold'),
                Tables\Columns\TextColumn::make('municipality')->label('Município')->placeholder('—'),
                Tables\Columns\IconColumn::make('has_document')->label('Documento')->boolean()
                    ->state(fn (Technician $record) => $record->hasKycDocument()),
                Tables\Columns\TextColumn::make('created_at')->label('Registo')->date('d/m/Y'),
            ])
            ->actions([
                Tables\Actions\Action::make('review')->label('Rever')->icon('heroicon-o-eye')
                    ->url(fn (Technician $record) => TechnicianResource::getUrl('edit', ['record' => $record])),
            ]);
    }
}
