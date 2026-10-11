<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CafpmifTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite(); // os testes não precisam do build do Vite
    }

    private function service(): Service
    {
        $cat = Category::create(['name' => 'Electricidade', 'slug' => 'electricidade']);

        return Service::create(['category_id' => $cat->id, 'name' => 'Avaria', 'slug' => 'avaria', 'base_price' => 15000, 'duration_minutes' => 60]);
    }

    public function test_public_pages_render_inertia_components(): void
    {
        $this->service();

        $this->get('/')->assertInertia(fn (Assert $p) => $p->component('Public/Home')->has('categories', 1));
        $this->get('/servicos')->assertInertia(fn (Assert $p) => $p->component('Public/Services')->has('services.data', 1));
        $this->get('/servicos/avaria')->assertInertia(fn (Assert $p) => $p->component('Public/ServiceShow')->where('service.slug', 'avaria'));
        $this->get('/tecnicos')->assertInertia(fn (Assert $p) => $p->component('Public/Technicians'));
        $this->get('/entrar')->assertInertia(fn (Assert $p) => $p->component('Auth/Login'));
        $this->get('/registar')->assertInertia(fn (Assert $p) => $p->component('Auth/Register'));
    }

    public function test_search_suggestions_json(): void
    {
        $this->service();

        $this->getJson('/servicos/sugestoes?q=Av')->assertOk()->assertJsonPath('0.slug', 'avaria');
        $this->getJson('/servicos/sugestoes?q=A')->assertOk()->assertExactJson([]);
    }

    public function test_panels_require_the_right_role(): void
    {
        $cliente = User::factory()->create(['role' => 'cliente']);
        $admin = User::factory()->create(['role' => 'admin']);

        $this->get('/cliente')->assertRedirect('/entrar');
        $this->get('/admin')->assertRedirect(); // Filament → /admin/login
        $this->actingAs($cliente)->get('/admin')->assertForbidden();
        $this->actingAs($admin)->get('/admin')->assertOk();
        $this->actingAs($admin)->get('/cliente')->assertForbidden();
    }

    public function test_client_registers_and_logs_in(): void
    {
        $this->post('/registar', [
            'tipo' => 'cliente', 'name' => 'Teste Cliente', 'email' => 'teste@exemplo.ao', 'phone' => '+244900111222',
            'password' => 'Senha1234', 'password_confirmation' => 'Senha1234',
        ])->assertRedirect('/cliente');

        $this->assertDatabaseHas('users', ['email' => 'teste@exemplo.ao', 'role' => 'cliente']);
    }

    public function test_full_order_flow(): void
    {
        $service = $this->service();
        $cliente = User::factory()->create(['role' => 'cliente']);
        $techUser = User::factory()->create(['role' => 'tecnico']);
        $tech = Technician::create(['user_id' => $techUser->id, 'kyc_status' => 'aprovado', 'municipality' => 'Viana']);
        $tech->categories()->sync([$service->category_id]);

        $this->actingAs($cliente)->post('/cliente/pedidos', [
            'service_id' => $service->id, 'address' => 'Rua 1', 'municipality' => 'Viana',
            'scheduled_at' => now()->addDay()->format('Y-m-d\TH:i'),
        ])->assertRedirect();
        $order = ServiceRequest::firstOrFail();
        $this->assertSame('pendente', $order->status);

        $this->actingAs($techUser)->post("/tecnico/trabalhos/{$order->id}/aceitar")->assertRedirect();
        $this->actingAs($techUser)->post("/tecnico/trabalhos/{$order->id}/iniciar")->assertRedirect();
        $this->actingAs($techUser)->post("/tecnico/trabalhos/{$order->id}/concluir")->assertRedirect();
        $this->assertSame('concluido', $order->fresh()->status);

        $this->actingAs($cliente)->post("/cliente/pedidos/{$order->id}/pagar", ['method' => 'multicaixa', 'reference' => 'X1'])->assertRedirect();
        $this->actingAs($cliente)->post("/cliente/pedidos/{$order->id}/avaliar", ['rating' => 5, 'comment' => 'Óptimo'])->assertRedirect();

        $this->assertEquals(5.0, $tech->fresh()->rating_avg);
        $this->actingAs($cliente)->get("/cliente/pedidos/{$order->id}")
            ->assertInertia(fn (Assert $p) => $p->component('Client/Requests/Show')->where('order.status', 'concluido'));
    }

    public function test_other_client_cannot_see_order(): void
    {
        $service = $this->service();
        $a = User::factory()->create(['role' => 'cliente']);
        $b = User::factory()->create(['role' => 'cliente']);
        $order = ServiceRequest::create([
            'code' => 'CAF-TEST', 'client_id' => $a->id, 'service_id' => $service->id, 'address' => 'x',
            'municipality' => 'y', 'scheduled_at' => now()->addDay(), 'price' => 1,
        ]);

        $this->actingAs($b)->get("/cliente/pedidos/{$order->id}")->assertForbidden();
    }
}
