<?php

namespace Tests\Feature;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Notifications\ServiceStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ServicePublicationTest extends TestCase
{
    use RefreshDatabase;

    protected User $providerUser;
    protected ServiceProvider $provider;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        Notification::fake();

        $this->providerUser = User::factory()->create([
            'type' => User::TYPE_PROVIDER,
        ]);

        $this->provider = ServiceProvider::factory()->create([
            'user_id' => $this->providerUser->id,
            'is_verified' => true,
        ]);

        $this->category = Category::factory()->create([
            'is_active' => true,
        ]);
    }

    public function test_provider_can_create_service(): void
    {
        $response = $this->actingAs($this->providerUser)
            ->post(route('provider.services.store'), [
                'name' => 'Meu Novo Serviço',
                'description' => 'Descrição detalhada do serviço',
                'category_id' => $this->category->id,
                'price_type' => PriceType::FIXED->value,
                'price_min' => 150.00,
                'location' => 'Luanda',
                'tags' => ['web', 'design'],
                'cover_image' => UploadedFile::fake()->image('cover.jpg', 800, 600),
            ]);

        $response->assertRedirect(route('provider.services.index'));

        $this->assertDatabaseHas('services', [
            'name' => 'Meu Novo Serviço',
            'service_provider_id' => $this->provider->id,
            'status' => ServiceStatus::PENDING->value,
        ]);
    }

    public function test_unverified_provider_cannot_create_service(): void
    {
        $this->provider->update(['is_verified' => false]);

        $response = $this->actingAs($this->providerUser)
            ->post(route('provider.services.store'), [
                'name' => 'Serviço Teste',
                'description' => 'Descrição',
                'category_id' => $this->category->id,
                'price_type' => PriceType::FIXED->value,
                'price_min' => 100.00,
                'cover_image' => UploadedFile::fake()->image('cover.jpg', 800, 600),
            ]);

        // Sem KYC aprovado o serviço não é criado (erro devolvido em "error").
        $response->assertSessionHasErrors('error');
        $this->assertDatabaseMissing('services', ['name' => 'Serviço Teste']);
    }

    public function test_admin_can_approve_service(): void
    {
        $admin = User::factory()->create(['type' => User::TYPE_ADMIN]);

        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PENDING,
        ]);

        // A acção "Aprovar" do painel Filament chama o ServiceService.
        app(\App\Services\ServiceService::class)->approve($service);

        $this->assertEquals(ServiceStatus::PUBLISHED, $service->fresh()->status);

        Notification::assertSentTo(
            $this->providerUser,
            ServiceStatusChanged::class
        );
    }

    public function test_approved_service_appears_in_listings(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
            'name' => 'Serviço Visível',
        ]);

        $response = $this->get(route('services.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('services.data', 1)
                ->where('services.data.0.name', 'Serviço Visível')
        );
    }

    public function test_pending_service_not_in_public_listings(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PENDING,
        ]);

        $response = $this->get(route('services.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('services.data', 0)
        );
    }

    public function test_provider_can_edit_own_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->providerUser)
            ->put(route('provider.services.update', $service), [
                'name' => 'Nome Actualizado',
                'description' => 'Nova descrição',
                'category_id' => $this->category->id,
                'price_type' => PriceType::FIXED->value,
                'price_min' => 200.00,
            ]);

        $response->assertRedirect();

        $this->assertEquals('Nome Actualizado', $service->fresh()->name);
    }

    public function test_provider_can_delete_own_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->providerUser)
            ->delete(route('provider.services.destroy', $service));

        $response->assertRedirect();

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_service_detail_page_increments_views(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
            'view_count' => 0,
        ]);

        $this->get(route('services.show', $service));

        $this->assertEquals(1, $service->fresh()->view_count);
    }
}
