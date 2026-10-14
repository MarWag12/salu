<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Conversation;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Enums\ServiceStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Percorre todas as páginas GET de cada perfil e garante que nenhuma devolve erro de servidor.
 */
class RoleSmokeTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private User $providerUser;
    private User $admin;
    private Service $service;
    private ServiceProvider $provider;
    private Order $order;
    private Conversation $conversation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->client = User::factory()->client()->create();
        $this->providerUser = User::factory()->provider()->create();
        $this->admin = User::factory()->create(['type' => User::TYPE_ADMIN]);
        $this->provider = ServiceProvider::factory()->for($this->providerUser, 'user')->create(['is_verified' => true]);
        $category = Category::factory()->create(['is_active' => true]);
        $this->service = Service::factory()->for($this->provider, 'serviceProvider')->create([
            'category_id' => $category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);
        $this->order = Order::factory()->forService($this->service)->forClient($this->client)->pending()->create();
        $this->conversation = Conversation::factory()->create([
            'client_id' => $this->client->id,
            'provider_id' => $this->providerUser->id,
            'service_id' => $this->service->id,
        ]);
    }

    private function urlsFor(string $role): array
    {
        $urls = [];
        foreach (Route::getRoutes() as $route) {
            if (!in_array('GET', $route->methods())) continue;
            $uri = $route->uri();
            if (str_contains($uri, '{')) continue;
            if (str_starts_with($uri, 'admin') || str_starts_with($uri, '_') || str_starts_with($uri, 'up')
                || str_starts_with($uri, 'storage') || str_starts_with($uri, 'sanctum') || str_starts_with($uri, 'livewire')
                || str_starts_with($uri, 'broadcasting') || str_contains($uri, 'logout') || str_starts_with($uri, 'api')
                || str_contains($uri, 'simulate') || str_contains($uri, 'verify-email') || str_contains($uri, 'success')
                || str_contains($uri, 'cancel')) continue;
            $urls[] = '/'.ltrim($uri, '/');
        }

        $extra = [
            "/services/{$this->service->id}",
            "/prestador/{$this->provider->id}",
            "/orders/{$this->order->id}",
            "/orders/{$this->order->id}/tasks",
            "/orders/{$this->order->id}/timer/status",
            "/orders/{$this->order->id}/timer/breakdown",
            "/messages/{$this->conversation->id}",
            "/reviews/create/{$this->service->id}",
            "/reviews/provider/{$this->provider->id}",
            "/disputes/create/{$this->order->id}",
            "/api/services/{$this->service->id}/reviews",
        ];

        return array_values(array_unique(array_merge($urls, $extra)));
    }

    private function assertNoServerErrors(?User $user, string $label): void
    {
        $failures = [];
        foreach ($this->urlsFor($label) as $url) {
            $response = $user ? $this->actingAs($user)->get($url) : $this->get($url);
            if ($response->getStatusCode() >= 500) {
                $failures[] = $response->getStatusCode().' '.$url;
            }
        }
        $this->assertEmpty($failures, "Erros de servidor ($label):\n".implode("\n", $failures));
    }

    public function test_visitor_pages(): void   { $this->assertNoServerErrors(null, 'visitor'); }
    public function test_client_pages(): void    { $this->assertNoServerErrors($this->client, 'client'); }
    public function test_provider_pages(): void  { $this->assertNoServerErrors($this->providerUser, 'provider'); }

    public function test_admin_panel_pages(): void
    {
        $urls = ['/admin'];
        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            if (in_array('GET', $route->methods()) && str_starts_with($uri, 'admin/') && !str_contains($uri, '{')) {
                $urls[] = '/'.$uri;
            }
        }
        $failures = [];
        foreach (array_unique($urls) as $url) {
            $r = $this->actingAs($this->admin)->get($url);
            if ($r->getStatusCode() >= 500) $failures[] = $r->getStatusCode().' '.$url;
        }
        $this->assertEmpty($failures, "Erros no painel admin:\n".implode("\n", $failures));
    }
}
