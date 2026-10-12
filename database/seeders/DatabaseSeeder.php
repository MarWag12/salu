<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceRequest;
use App\Models\Technician;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- Administrador ----
        User::firstOrCreate(['email' => 'admin@salu.ao'], [
            'name' => 'Administrador Salu',
            'phone' => '+244 900 000 000',
            'role' => User::ROLE_ADMIN,
            'password' => 'Admin@2026',
        ]);

        // ---- Categorias e serviços ----
        $this->call(CatalogSeeder::class);

        // ---- Técnicos de demonstração ----
        $techs = [
            ['Domingos Kiala', 'domingos@salu.ao', 'Viana', 6, ['electricidade', 'ar-condicionado']],
            ['Joaquim Mateus', 'joaquim@salu.ao', 'Cazenga', 9, ['canalizacao', 'serralharia']],
            ['Pedro Cassule', 'pedro@salu.ao', 'Talatona', 4, ['pintura', 'carpintaria', 'limpeza']],
        ];
        $techModels = [];
        foreach ($techs as [$name, $email, $mun, $years, $slugs]) {
            $u = User::create(['name' => $name, 'email' => $email, 'phone' => '+244 923 000 00'.count($techModels), 'role' => User::ROLE_TECNICO, 'password' => 'Tecnico@2026']);
            $t = Technician::create([
                'user_id' => $u->id,
                'bio' => "Técnico com {$years} anos de experiência em manutenção doméstica.",
                'municipality' => $mun,
                'experience_years' => $years,
                'kyc_status' => Technician::KYC_APROVADO,
            ]);
            $t->categories()->sync(Category::whereIn('slug', $slugs)->pluck('id'));
            $techModels[] = $t;
        }

        // Um técnico com KYC pendente (aparece na fila de verificação)
        $pend = User::create(['name' => 'Manuel Ngola', 'email' => 'manuel@salu.ao', 'phone' => '+244 924 111 222', 'role' => User::ROLE_TECNICO, 'password' => 'Tecnico@2026']);
        $pt = Technician::create(['user_id' => $pend->id, 'bio' => 'Electricista residencial.', 'municipality' => 'Kilamba', 'experience_years' => 3]);
        $pt->categories()->sync(Category::where('slug', 'electricidade')->pluck('id'));

        // ---- Clientes de demonstração ----
        $c1 = User::create(['name' => 'Ana Francisco', 'email' => 'ana@exemplo.ao', 'phone' => '+244 931 222 333', 'role' => User::ROLE_CLIENTE, 'password' => 'Cliente@2026']);
        $c2 = User::create(['name' => 'Carlos Pinto', 'email' => 'carlos@exemplo.ao', 'phone' => '+244 932 444 555', 'role' => User::ROLE_CLIENTE, 'password' => 'Cliente@2026']);

        // ---- Pedidos de demonstração ----
        $svc = fn (string $slug) => Service::where('slug', $slug)->first();

        // 1) concluído, pago e avaliado
        $s = $svc('reparacao-de-avaria-electrica');
        $r1 = ServiceRequest::create([
            'code' => ServiceRequest::generateCode(), 'client_id' => $c1->id, 'service_id' => $s->id,
            'technician_id' => $techModels[0]->id, 'address' => 'Rua 12, Casa 45, Zango 3', 'municipality' => 'Viana',
            'scheduled_at' => now()->subDays(3), 'description' => 'Sem energia na cozinha.',
            'status' => ServiceRequest::CONCLUIDO, 'price' => $s->base_price, 'completed_at' => now()->subDays(3)->addHours(2),
        ]);
        Payment::create(['service_request_id' => $r1->id, 'amount' => $r1->price, 'method' => 'multicaixa', 'reference' => 'MCX-884412', 'status' => Payment::CONFIRMADO, 'confirmed_at' => now()->subDays(2)]);
        Review::create(['service_request_id' => $r1->id, 'client_id' => $c1->id, 'technician_id' => $techModels[0]->id, 'rating' => 5, 'comment' => 'Muito profissional e rápido.']);
        $techModels[0]->recalcRating();

        // 2) atribuído
        $s = $svc('reparacao-de-fuga-de-agua');
        ServiceRequest::create([
            'code' => ServiceRequest::generateCode(), 'client_id' => $c2->id, 'service_id' => $s->id,
            'technician_id' => $techModels[1]->id, 'address' => 'Av. Deolinda Rodrigues, nº 210', 'municipality' => 'Cazenga',
            'scheduled_at' => now()->addDay()->setTime(9, 0), 'description' => 'Fuga debaixo do lavatório da casa de banho.',
            'status' => ServiceRequest::ATRIBUIDO, 'price' => $s->base_price,
        ]);

        // 3) pendente (por atribuir)
        $s = $svc('limpeza-e-manutencao-de-ac');
        ServiceRequest::create([
            'code' => ServiceRequest::generateCode(), 'client_id' => $c1->id, 'service_id' => $s->id,
            'address' => 'Condomínio Pérola Coulto, Zango 1', 'municipality' => 'Viana',
            'scheduled_at' => now()->addDays(2)->setTime(14, 0), 'description' => 'Dois aparelhos split na sala e quarto.',
            'status' => ServiceRequest::PENDENTE, 'price' => $s->base_price,
        ]);
    }
}
