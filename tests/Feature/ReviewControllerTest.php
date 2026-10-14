<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReviewControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
    }

    public function test_client_can_view_reviews_index(): void
    {
        $client = User::factory()->client()->create();

        $response = $this->actingAs($client)->get(route('reviews.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Reviews/Index'));
    }

    public function test_provider_can_view_reviews_index(): void
    {
        $providerUser = User::factory()->provider()->create();
        ServiceProvider::factory()->for($providerUser, 'user')->create();

        $response = $this->actingAs($providerUser)->get(route('reviews.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Reviews/ProviderIndex'));
    }

    public function test_unauthenticated_user_cannot_view_reviews(): void
    {
        $response = $this->get(route('reviews.index'));

        $response->assertRedirect(route('login'));
    }

    public function test_client_can_view_create_review_page(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $response = $this->actingAs($client)->get(route('reviews.create', $service));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Reviews/Create'));
    }

    public function test_client_can_create_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $response = $this->actingAs($client)->post(route('reviews.store'), [
            'service_id' => $service->id,
            'service_rating' => 5,
            'service_comment' => 'Excelente serviço!',
            'provider_rating' => 4,
            'provider_comment' => 'Prestador pontual.',
        ]);

        $response->assertRedirect(route('services.show', $service));
        $this->assertDatabaseHas('reviews', [
            'service_id' => $service->id,
            'user_id' => $client->id,
            'review_type' => 'service',
            'rating' => 5,
            'comment' => 'Excelente serviço!',
        ]);
        // A avaliação do prestador fica gravada para a mesma combinação serviço/utilizador.
        $this->assertDatabaseHas('reviews', [
            'service_id' => $service->id,
            'user_id' => $client->id,
            'review_type' => 'provider',
            'rating' => 4,
        ]);
    }

    public function test_review_requires_rating(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $response = $this->actingAs($client)->post(route('reviews.store'), [
            'service_id' => $service->id,
            'service_comment' => 'Comentário sem rating',
        ]);

        $response->assertSessionHasErrors(['service_rating', 'provider_rating']);
    }

    public function test_rating_must_be_between_1_and_5(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $response = $this->actingAs($client)->post(route('reviews.store'), [
            'service_id' => $service->id,
            'service_rating' => 6,
            'provider_rating' => 0,
        ]);

        $response->assertSessionHasErrors(['service_rating', 'provider_rating']);
    }

    public function test_client_can_edit_own_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['created_at' => now()->subDays(3)]);

        $response = $this->actingAs($client)->get(route('reviews.edit', $review));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Reviews/Edit'));
    }

    public function test_client_can_update_own_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['rating' => 3, 'created_at' => now()->subDays(3)]);

        $response = $this->actingAs($client)->patch(route('reviews.update', $review), [
            'rating' => 5,
            'comment' => 'Actualização da avaliação',
        ]);

        $response->assertRedirect(route('reviews.index'));

        $review->refresh();
        $this->assertEquals(5, $review->rating);
        $this->assertEquals('Actualização da avaliação', $review->comment);
    }

    public function test_client_cannot_update_other_users_review(): void
    {
        $client = User::factory()->client()->create();
        $otherClient = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $response = $this->actingAs($otherClient)->patch(route('reviews.update', $review), [
            'rating' => 1,
        ]);

        $response->assertSessionHasErrors(['error']);
    }

    public function test_client_can_delete_own_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $response = $this->actingAs($client)->delete(route('reviews.destroy', $review));

        $response->assertRedirect(route('reviews.index'));
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_provider_can_respond_to_review(): void
    {
        $client = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $response = $this->actingAs($providerUser)->post(route('reviews.respond', $review), [
            'response' => 'Obrigado pelo feedback!',
        ]);

        $response->assertRedirect();

        $review->refresh();
        $this->assertEquals('Obrigado pelo feedback!', $review->provider_response);
    }

    public function test_non_provider_cannot_respond_to_review(): void
    {
        $client = User::factory()->client()->create();
        $otherClient = User::factory()->client()->create();
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $response = $this->actingAs($otherClient)->post(route('reviews.respond', $review), [
            'response' => 'Resposta não autorizada',
        ]);

        $response->assertSessionHasErrors(['error']);
    }

    public function test_public_can_view_service_reviews_api(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        Review::factory()->count(3)->forService($service)->create(['is_visible' => true]);

        $response = $this->getJson(route('api.services.reviews', $service));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'reviews' => ['data'],
            'stats' => ['total', 'average', 'distribution'],
        ]);
    }
}
