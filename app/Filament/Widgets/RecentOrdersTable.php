<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Support\Format;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget;

class RecentOrdersTable extends TableWidget
{
    protected static ?int $sort = 4;

    protected static ?string $heading = 'Pedidos recentes';

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(ServiceRequest::query()->with(['service', 'client', 'technician.user'])->latest()->limit(6))
            ->paginated(false)
            ->emptyStateHeading('Ainda sem pedidos')
            ->columns(ServiceRequestResource::summaryColumns())
            ->actions([
                Tables\Actions\Action::make('open')->label('Abrir')->icon('heroicon-o-eye')
                    ->url(fn (ServiceRequest $record) => ServiceRequestResource::getUrl('view', ['record' => $record])),
            ]);
    }
}
