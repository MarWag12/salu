<?php

namespace Tests\Unit\Services;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\ServiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ServiceServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ServiceService $serviceService;
    protected User $providerUser;
    protected ServiceProvider $provider;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->serviceService = app(ServiceService::class);

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

    public function test_can_create_service(): void
    {
        $data = [
            'name' => 'Serviço de Teste',
            'description' => 'Descrição do serviço de teste',
            'category_id' => $this->category->id,
            'price_type' => PriceType::FIXED->value,
            'price_min' => 100.00,
            'location' => 'Luanda',
            'tags' => ['tag1', 'tag2'],
        ];

        $service = $this->serviceService->create($this->provider, $data);

        $this->assertInstanceOf(Service::class, $service);
        $this->assertEquals('Serviço de Teste', $service->name);
        $this->assertEquals(ServiceStatus::PENDING, $service->status);
        $this->assertEquals($this->provider->id, $service->service_provider_id);
    }

    public function test_cannot_create_service_without_kyc(): void
    {
        $this->provider->update(['is_verified' => false]);

        $this->expectException(ValidationException::class);

        $this->serviceService->create($this->provider, [
            'name' => 'Serviço de Teste',
            'description' => 'Descrição',
            'category_id' => $this->category->id,
            'price_type' => PriceType::FIXED->value,
            'price_min' => 100.00,
        ]);
    }

    public function test_can_update_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'name' => 'Serviço Original',
        ]);

        $updated = $this->serviceService->update($service, [
            'name' => 'Serviço Actualizado',
            'description' => 'Nova descrição',
        ]);

        $this->assertEquals('Serviço Actualizado', $updated->name);
        $this->assertEquals('Nova descrição', $updated->description);
    }

    public function test_can_approve_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PENDING,
        ]);

        $approved = $this->serviceService->approve($service);

        $this->assertEquals(ServiceStatus::PUBLISHED, $approved->status);
    }

    public function test_can_suspend_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $suspended = $this->serviceService->suspend($service);

        $this->assertEquals(ServiceStatus::SUSPENDED, $suspended->status);
    }

    public function test_can_delete_service(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
        ]);

        $this->serviceService->delete($service);

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_can_activate_highlight(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $highlighted = $this->serviceService->activateHighlight($service, 7);

        $this->assertEquals(ServiceStatus::FEATURED, $highlighted->status);
        $this->assertNotNull($highlighted->highlight_expires_at);
        $this->assertTrue($highlighted->highlight_expires_at->isFuture());
    }

    public function test_can_expire_highlights(): void
    {
        $service = Service::factory()->create([
            'service_provider_id' => $this->provider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::FEATURED,
            'highlight_expires_at' => now()->subDay(),
        ]);

        $count = $this->serviceService->expireHighlights();

        $this->assertEquals(1, $count);
        $this->assertEquals(ServiceStatus::PUBLISHED, $service->fresh()->status);
    }
}
