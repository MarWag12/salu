<?php

namespace Tests\Feature;

use App\Enums\PriceType;
use App\Models\Dispute;
use App\Models\Service;
use App\Models\ServiceProvider;
use App\Models\User;
use App\Services\OrderService;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DisputeAndTimerHttpTest extends TestCase
{
    use RefreshDatabase;

    private User $client;
    private User $providerUser;
    private ServiceProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();
        $this->client = User::factory()->client()->create();
        $this->providerUser = User::factory()->provider()->create();
        $this->provider = ServiceProvider::factory()->for($this->providerUser, 'user')->create(['is_verified' => true]);
        app(WalletService::class)->topUp($this->client, 100000);
    }

    private function inProgressOrder(array $serviceState = [], ?float $price = null)
    {
        $service = Service::factory()->for($this->provider, 'serviceProvider')
            ->create(array_merge(['price_min' => 10000], $serviceState));
        $orders = app(OrderService::class);
        $order = $orders->createOrder($service, $this->client, null, $price);
        $orders->acceptOrder($order, $this->providerUser);
        $orders->startOrder($order->fresh(), $this->providerUser);

        return $order->fresh();
    }

    public function test_client_opens_provider_responds_client_cancels_dispute(): void
    {
        $order = $this->inProgressOrder();

        $this->actingAs($this->client)->post(route('disputes.store'), [
            'order_id' => $order->id,
            'reason' => array_key_first(Dispute::getReasons()),
            'description' => 'O serviço não foi realizado como combinado.',
        ])->assertRedirect();

        $dispute = Dispute::firstOrFail();
        $this->assertEquals('disputed', $order->fresh()->status->value);

        $this->actingAs($this->providerUser)->post(route('disputes.respond', $dispute), [
            'response' => 'Realizei o trabalho e tenho fotos que o comprovam.',
        ])->assertSessionHasNoErrors();
        $this->assertNotNull($dispute->fresh()->provider_response);

        $this->actingAs($this->client)->post(route('disputes.cancel', $dispute))->assertRedirect();
        $this->assertEquals('cancelled', $dispute->fresh()->status);
    }

    public function test_provider_cannot_open_dispute(): void
    {
        $order = $this->inProgressOrder();

        $this->actingAs($this->providerUser)->post(route('disputes.store'), [
            'order_id' => $order->id,
            'reason' => array_key_first(Dispute::getReasons()),
            'description' => 'Tentativa indevida de abrir disputa.',
        ])->assertForbidden();
    }

    public function test_hourly_timer_start_pause_resume_stop(): void
    {
        $order = $this->inProgressOrder(['price_type' => PriceType::HOURLY], 10000);
        $this->assertEquals(10000, (float) $order->hourly_rate);

        $this->actingAs($this->providerUser)->postJson(route('orders.timer.start', $order))->assertOk();
        $this->actingAs($this->providerUser)->getJson(route('orders.timer.status', $order))
            ->assertOk()->assertJsonPath('is_active', true);

        $this->actingAs($this->providerUser)->postJson(route('orders.timer.pause', $order), ['reason' => 'Pausa'])->assertOk();
        $this->actingAs($this->providerUser)->postJson(route('orders.timer.resume', $order))->assertOk();
        $this->actingAs($this->providerUser)->postJson(route('orders.timer.stop', $order))
            ->assertOk()->assertJsonStructure(['elapsed_seconds', 'calculated_price']);

        // O cliente vê o estado mas não controla o cronómetro.
        $this->actingAs($this->client)->getJson(route('orders.timer.status', $order))->assertOk();
        $this->actingAs($this->client)->postJson(route('orders.timer.start', $order))->assertStatus(403);
    }

    public function test_hourly_final_settlement_charges_real_time_and_refunds_excess(): void
    {
        $order = $this->inProgressOrder(['price_type' => PriceType::HOURLY], 10000);
        $wallets = app(WalletService::class);

        // Retido 1,5x o estimado
        $this->assertEquals(15000, $wallets->activeHeldAmount($order));

        // Trabalhou o equivalente a 6000 AOA
        $order->update(['calculated_price' => 6000]);
        $orders = app(OrderService::class);
        $orders->deliverOrder($order->fresh(), $this->providerUser);
        $orders->completeOrder($order->fresh(), $this->client);

        $client = $wallets->getOrCreateWallet($this->client)->fresh();
        $provider = $wallets->getOrCreateWallet($this->providerUser)->fresh();
        $this->assertEquals(94000, (float) $client->balance);
        $this->assertEquals(94000, (float) $client->available_balance);
        $this->assertEquals(0, (float) $client->held_balance);
        $this->assertEquals(5400, (float) $provider->balance);
        $this->assertEquals(6000, (float) $order->fresh()->agreed_price);
    }

    public function test_timer_measures_real_time_excluding_pauses(): void
    {
        $order = $this->inProgressOrder(['price_type' => PriceType::HOURLY], 10000);
        $p = $this->actingAs($this->providerUser);

        $p->postJson(route('orders.timer.start', $order))->assertOk();
        $this->travel(30)->minutes();
        $p->postJson(route('orders.timer.pause', $order), ['reason' => 'Almoço'])->assertOk();
        $this->travel(20)->minutes();   // pausa: não conta
        $p->postJson(route('orders.timer.resume', $order))->assertOk();
        $this->travel(30)->minutes();

        $p->getJson(route('orders.timer.status', $order))->assertJsonPath('elapsed_seconds', 3600);

        $p->postJson(route('orders.timer.stop', $order))
            ->assertOk()
            ->assertJsonPath('elapsed_seconds', 3600)
            ->assertJsonPath('calculated_price', 10000);

        $this->assertEquals(10000, (float) $order->fresh()->calculated_price);
        $this->assertEquals(3600, $order->fresh()->total_work_duration_seconds);
    }
}
