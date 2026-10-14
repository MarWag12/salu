<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\HighlightPlan;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Criar Admin
        $this->call(AdminUserSeeder::class);

        // Criar Categorias
        $this->seedCategories();

        // Criar Planos de Destaque
        $this->call(HighlightPlanSeeder::class);

        $this->command->info('Base de dados populada com sucesso!');
    }

    /**
     * Criar categorias de serviços
     */
    private function seedCategories(): void
    {
        $categories = [
            [
                'name' => 'Tecnologia e Informática',
                'slug' => 'tecnologia-informatica',
                'description' => 'Serviços de TI, desenvolvimento, suporte técnico e mais',
                'icon' => 'heroicon-o-computer-desktop',
            ],
            [
                'name' => 'Construção e Reparação',
                'slug' => 'construcao-reparacao',
                'description' => 'Obras, reparações, manutenção de imóveis',
                'icon' => 'heroicon-o-wrench-screwdriver',
            ],
            [
                'name' => 'Saúde e Bem-Estar',
                'slug' => 'saude-bem-estar',
                'description' => 'Serviços médicos, terapias, fitness e cuidados pessoais',
                'icon' => 'heroicon-o-heart',
            ],
            [
                'name' => 'Educação e Formação',
                'slug' => 'educacao-formacao',
                'description' => 'Aulas particulares, cursos, mentoria',
                'icon' => 'heroicon-o-academic-cap',
            ],
            [
                'name' => 'Limpeza e Domésticos',
                'slug' => 'limpeza-domesticos',
                'description' => 'Limpeza residencial e comercial, empregadas domésticas',
                'icon' => 'heroicon-o-sparkles',
            ],
            [
                'name' => 'Transporte e Logística',
                'slug' => 'transporte-logistica',
                'description' => 'Mudanças, entregas, transporte de passageiros',
                'icon' => 'heroicon-o-truck',
            ],
            [
                'name' => 'Beleza e Estética',
                'slug' => 'beleza-estetica',
                'description' => 'Cabeleireiros, manicure, maquilhagem, estética',
                'icon' => 'heroicon-o-sparkles',
            ],
            [
                'name' => 'Eventos e Entretenimento',
                'slug' => 'eventos-entretenimento',
                'description' => 'Organização de eventos, DJs, fotografia, catering',
                'icon' => 'heroicon-o-musical-note',
            ],
            [
                'name' => 'Serviços Jurídicos',
                'slug' => 'servicos-juridicos',
                'description' => 'Advogados, consultoria legal, documentação',
                'icon' => 'heroicon-o-scale',
            ],
            [
                'name' => 'Contabilidade e Finanças',
                'slug' => 'contabilidade-financas',
                'description' => 'Contabilistas, consultoria financeira, impostos',
                'icon' => 'heroicon-o-calculator',
            ],
            [
                'name' => 'Marketing e Design',
                'slug' => 'marketing-design',
                'description' => 'Design gráfico, marketing digital, publicidade',
                'icon' => 'heroicon-o-paint-brush',
            ],
            [
                'name' => 'Mecânica e Automóveis',
                'slug' => 'mecanica-automoveis',
                'description' => 'Reparação de veículos, electricista auto, lavagem',
                'icon' => 'heroicon-o-wrench',
            ],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }

        $this->command->info('Categorias criadas: ' . count($categories));
    }
}
