<?php

namespace App\Providers\Filament;

use App\Filament\Widgets\FinanceStats;
use App\Filament\Widgets\OperationsStats;
use App\Filament\Widgets\PendingKycTable;
use App\Filament\Widgets\RecentOrdersTable;
use App\Http\Middleware\SetAdminLocale;
use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Navigation\NavigationGroup;
use Filament\Navigation\NavigationItem;
use Filament\Pages;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;

/** Painel administrativo em /admin (Filament 3): só utilizadores com role "admin" (ver User::canAccessPanel). */
class AdminPanelProvider extends PanelProvider
{
    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->login()
            ->brandName('CAFPMIF')
            ->colors(['primary' => Color::Blue])
            ->font('Plus Jakarta Sans')
            ->discoverResources(in: app_path('Filament/Resources'), for: 'App\\Filament\\Resources')
            ->pages([Pages\Dashboard::class])
            ->widgets([
                OperationsStats::class,
                FinanceStats::class,
                PendingKycTable::class,
                RecentOrdersTable::class,
            ])
            ->navigationGroups([
                NavigationGroup::make('Financeiro'),
                NavigationGroup::make('Gestão de Serviços'),
                NavigationGroup::make('Gestão de Técnicos'),
                NavigationGroup::make('Gestão de Utilizadores'),
                NavigationGroup::make('Gestão de Pedidos'),
                NavigationGroup::make('Sistema'),
            ])
            ->navigationItems([
                NavigationItem::make('Ver site')->url('/')->icon('heroicon-o-globe-alt')->sort(100),
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
                SetAdminLocale::class,
            ])
            ->authMiddleware([Authenticate::class]);
    }
}
