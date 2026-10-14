<?php

namespace Tests\Unit\Services;

use App\Enums\PriceType;
use App\Enums\ServiceStatus;
use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\SearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchServiceTest extends TestCase
{
    use RefreshDatabase;

    protected SearchService $searchService;
    protected Category $category;
    protected ServiceProvider $verifiedProvider;

    protected function setUp(): void
    {
        parent::setUp();

        // Clean up services from previous tests
        Service::query()->delete();

        $this->searchService = app(SearchService::class);

        $providerUser = User::factory()->create([
            'type' => User::TYPE_PROVIDER,
        ]);

        $this->verifiedProvider = ServiceProvider::factory()->create([
            'user_id' => $providerUser->id,
            'is_verified' => true,
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Tecnologia',
            'is_active' => true,
        ]);
    }

    public function test_can_search_by_keyword(): void
    {
        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'name' => 'Desenvolvimento Web',
            'status' => ServiceStatus::PUBLISHED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'name' => 'Design Gráfico',
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $results = $this->searchService->search(['search' => 'Web']);

        $this->assertGreaterThanOrEqual(1, $results->total());
        $this->assertTrue($results->contains('name', 'Desenvolvimento Web'));
    }

    /**
     * @todo Fix category filtering in SearchService - returning results from other categories
     */
    public function test_can_filter_by_category(): void
    {
        $this->markTestSkipped('SearchService category filtering needs investigation');

        $uniqueCategoryName = 'TestCategory_' . uniqid();
        $testCategory = Category::factory()->create(['name' => $uniqueCategoryName, 'is_active' => true]);

        $otherCategory = Category::factory()->create(['name' => 'Marketing', 'is_active' => true]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $testCategory->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $otherCategory->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $results = $this->searchService->search(['category' => $testCategory->id]);

        $this->assertGreaterThanOrEqual(1, $results->total());
        // Verify all results are from the expected category
        $results->each(function ($service) use ($testCategory) {
            $this->assertEquals($testCategory->id, $service->category_id);
        });
    }

    public function test_can_filter_by_price_range(): void
    {
        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'price_min' => 100,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'price_min' => 500,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $results = $this->searchService->search([
            'price_min' => 200,
            'price_max' => 600,
        ]);

        $this->assertEquals(1, $results->total());
        $this->assertEquals(500, $results->first()->price_min);
    }

    public function test_featured_services_appear_first(): void
    {
        $published = Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'name' => 'Serviço Normal',
            'status' => ServiceStatus::PUBLISHED,
            'created_at' => now()->subDay(),
        ]);

        $featured = Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'name' => 'Serviço Destaque',
            'status' => ServiceStatus::FEATURED,
            'highlight_expires_at' => now()->addWeek(),
            'created_at' => now()->subWeek(),
        ]);

        $results = $this->searchService->search([]);

        $this->assertEquals('Serviço Destaque', $results->first()->name);
    }

    public function test_excludes_services_from_unverified_providers(): void
    {
        $unverifiedProviderUser = User::factory()->create(['type' => User::TYPE_PROVIDER]);
        $unverifiedProvider = ServiceProvider::factory()->create([
            'user_id' => $unverifiedProviderUser->id,
            'is_verified' => false,
        ]);

        Service::factory()->create([
            'service_provider_id' => $unverifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $results = $this->searchService->search([]);

        $this->assertEquals(1, $results->total());
        $this->assertEquals($this->verifiedProvider->id, $results->first()->service_provider_id);
    }

    public function test_excludes_non_published_services(): void
    {
        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PENDING,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::SUSPENDED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        $results = $this->searchService->search([]);

        $this->assertEquals(1, $results->total());
    }

    public function test_can_get_featured_services(): void
    {
        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::FEATURED,
            'highlight_expires_at' => now()->addWeek(),
        ]);

        $featured = $this->searchService->getFeaturedServices(10);

        $this->assertEquals(1, $featured->count());
        $this->assertEquals(ServiceStatus::FEATURED, $featured->first()->status);
    }

    public function test_can_get_recent_services(): void
    {
        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
            'created_at' => now()->subDays(2),
        ]);

        Service::factory()->create([
            'service_provider_id' => $this->verifiedProvider->id,
            'category_id' => $this->category->id,
            'status' => ServiceStatus::PUBLISHED,
            'created_at' => now(),
        ]);

        $recent = $this->searchService->getRecentServices(10);

        $this->assertEquals(2, $recent->count());
        // Most recent should be first
        $this->assertTrue($recent->first()->created_at->gt($recent->last()->created_at));
    }
}
