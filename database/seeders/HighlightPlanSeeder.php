<?php

namespace Database\Seeders;

use App\Models\HighlightPlan;
use Illuminate\Database\Seeder;

class HighlightPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Destaque Semanal',
                'duration_days' => 7,
                'price' => 5000.00,
                'currency' => 'AOA',
                'is_active' => true,
            ],
            [
                'name' => 'Destaque Mensal',
                'duration_days' => 30,
                'price' => 15000.00,
                'currency' => 'AOA',
                'is_active' => true,
            ],
            [
                'name' => 'Destaque Trimestral',
                'duration_days' => 90,
                'price' => 35000.00,
                'currency' => 'AOA',
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            HighlightPlan::updateOrCreate(
                ['duration_days' => $plan['duration_days']],
                $plan
            );
        }

        $this->command->info('Planos de destaque criados: ' . count($plans));
    }
}
