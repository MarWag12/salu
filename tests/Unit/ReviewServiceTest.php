<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\ReviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReviewServiceTest extends TestCase
{
    use RefreshDatabase;

    protected ReviewService $reviewService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->reviewService = app(ReviewService::class);
        Notification::fake();
    }

    public function test_can_create_review(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = $this->reviewService->createReview($service, $client, 5, 'Excelente serviço!');

        $this->assertDatabaseHas('reviews', [
            'id' => $review->id,
            'service_id' => $service->id,
            'user_id' => $client->id,
            'rating' => 5,
            'comment' => 'Excelente serviço!',
            'is_verified' => false,
            'is_visible' => true,
        ]);
    }

    public function test_can_create_verified_review_from_order(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->completed()
            ->create();

        $review = $this->reviewService->createReview($service, $client, 4, 'Bom serviço!', $order);

        $this->assertTrue($review->is_verified);
        $this->assertEquals($order->id, $review->order_id);
    }

    public function test_cannot_review_same_service_twice(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        // Create first review
        $this->reviewService->createReview($service, $client, 5, 'Primeira avaliação');

        // Try to create second review
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Já avaliou este serviço anteriormente.');

        $this->reviewService->createReview($service, $client, 3, 'Segunda avaliação');
    }

    public function test_cannot_review_order_not_completed(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $order = Order::factory()
            ->forService($service)
            ->forClient($client)
            ->inProgress()
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Só pode avaliar serviços de pedidos concluídos.');

        $this->reviewService->createReview($service, $client, 4, 'Avaliação', $order);
    }

    public function test_can_update_review_within_7_days(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['rating' => 3, 'created_at' => now()->subDays(3)]);

        $updatedReview = $this->reviewService->updateReview($review, $client, 5, 'Actualizado!');

        $this->assertEquals(5, $updatedReview->rating);
        $this->assertEquals('Actualizado!', $updatedReview->comment);
    }

    public function test_cannot_update_review_after_7_days(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['rating' => 3, 'created_at' => now()->subDays(10)]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Só pode editar avaliações até 7 dias após a criação.');

        $this->reviewService->updateReview($review, $client, 5, 'Actualizado!');
    }

    public function test_cannot_update_other_users_review(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();
        $otherUser = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Não tem permissão para editar esta avaliação.');

        $this->reviewService->updateReview($review, $otherUser, 5, 'Hackeado!');
    }

    public function test_provider_can_respond_to_review(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $updatedReview = $this->reviewService->addProviderResponse(
            $review,
            $providerUser,
            'Obrigado pelo feedback!'
        );

        $this->assertEquals('Obrigado pelo feedback!', $updatedReview->provider_response);
        $this->assertNotNull($updatedReview->provider_responded_at);
    }

    public function test_provider_cannot_respond_twice(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->withResponse()
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Esta avaliação já tem uma resposta.');

        $this->reviewService->addProviderResponse($review, $providerUser, 'Outra resposta');
    }

    public function test_non_provider_cannot_respond(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();
        $otherUser = User::factory()->provider()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Não tem permissão para responder a esta avaliação.');

        $this->reviewService->addProviderResponse($review, $otherUser, 'Resposta não autorizada');
    }

    public function test_has_user_reviewed(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $this->assertFalse($this->reviewService->hasUserReviewed($service, $client));

        Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['review_type' => 'service']);

        // Só a avaliação do serviço: ainda falta a do prestador.
        $this->assertFalse($this->reviewService->hasUserReviewed($service, $client));

        Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create(['review_type' => 'provider']);

        $this->assertTrue($this->reviewService->hasUserReviewed($service, $client));
    }

    public function test_get_service_reviews(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        // Create visible reviews
        Review::factory()->count(3)->forService($service)->create(['is_visible' => true]);

        // Create hidden review
        Review::factory()->forService($service)->hidden()->create();

        $reviews = $this->reviewService->getServiceReviews($service);

        $this->assertCount(3, $reviews);
    }

    public function test_get_service_review_stats(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();

        Review::factory()->forService($service)->rating(5)->create(['is_visible' => true]);
        Review::factory()->forService($service)->rating(5)->create(['is_visible' => true]);
        Review::factory()->forService($service)->rating(4)->create(['is_visible' => true]);
        Review::factory()->forService($service)->rating(3)->verified()->create(['is_visible' => true]);
        Review::factory()->forService($service)->rating(1)->hidden()->create();

        $stats = $this->reviewService->getServiceReviewStats($service);

        $this->assertEquals(4, $stats['total']);
        $this->assertEquals(4.25, $stats['average']);
        $this->assertEquals(2, $stats['distribution'][5]);
        $this->assertEquals(1, $stats['distribution'][4]);
        $this->assertEquals(1, $stats['distribution'][3]);
        $this->assertEquals(1, $stats['verified_count']);
    }

    public function test_can_delete_own_review(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $result = $this->reviewService->deleteReview($review, $client);

        $this->assertTrue($result);
        $this->assertDatabaseMissing('reviews', ['id' => $review->id]);
    }

    public function test_cannot_delete_other_users_review(): void
    {
        $providerUser = User::factory()->provider()->create();
        $provider = ServiceProvider::factory()->for($providerUser, 'user')->create();
        $service = Service::factory()->for($provider, 'serviceProvider')->create();
        $client = User::factory()->client()->create();
        $otherUser = User::factory()->client()->create();

        $review = Review::factory()
            ->forService($service)
            ->byUser($client)
            ->create();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Não tem permissão para eliminar esta avaliação.');

        $this->reviewService->deleteReview($review, $otherUser);
    }
}
