<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/** Catálogo inicial de categorias e serviços da Salu (idempotente: pode correr mais do que uma vez). */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['Electricidade', 'ti-bolt', 'Instalações, quadros eléctricos, tomadas e iluminação.', [
                ['Reparação de avaria eléctrica', 15000, 90, true],
                ['Instalação de tomadas e interruptores', 8000, 60, false],
                ['Instalação de quadro eléctrico', 45000, 240, false],
            ]],
            ['Canalização', 'ti-droplet', 'Fugas, torneiras, desentupimentos e casas de banho.', [
                ['Reparação de fuga de água', 12000, 90, true],
                ['Desentupimento de esgotos', 18000, 120, false],
                ['Instalação de sanita ou lavatório', 25000, 150, false],
            ]],
            ['Pintura', 'ti-paint', 'Pintura interior e exterior, tratamento de paredes.', [
                ['Pintura de divisão (até 20 m²)', 35000, 480, false],
                ['Pintura exterior de moradia', 120000, 1440, false],
            ]],
            ['Carpintaria', 'ti-hammer', 'Portas, janelas, armários e móveis por medida.', [
                ['Reparação de portas e janelas', 14000, 120, false],
                ['Montagem de armário', 20000, 180, false],
            ]],
            ['Ar Condicionado', 'ti-snowflake', 'Instalação, limpeza e manutenção de AC.', [
                ['Limpeza e manutenção de AC', 16000, 90, true],
                ['Instalação de split', 40000, 180, false],
            ]],
            ['Serralharia', 'ti-lock', 'Fechaduras, grades, portões e soldaduras.', [
                ['Troca de fechadura', 10000, 60, false],
                ['Reparação de portão', 30000, 180, false],
            ]],
            ['Limpeza', 'ti-sparkles', 'Limpeza pós-obra e limpeza geral da casa.', [
                ['Limpeza geral de casa', 22000, 240, false],
                ['Limpeza pós-obra', 60000, 480, false],
            ]],
        ];

        foreach ($catalog as [$name, $icon, $desc, $services]) {
            $cat = Category::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'icon' => $icon, 'description' => $desc],
            );
            foreach ($services as [$sName, $price, $mins, $featured]) {
                Service::firstOrCreate(
                    ['slug' => Str::slug($sName)],
                    [
                        'category_id' => $cat->id,
                        'name' => $sName,
                        'description' => "Serviço de {$name} realizado por técnicos verificados da Salu.",
                        'base_price' => $price,
                        'duration_minutes' => $mins,
                        'featured' => $featured,
                    ],
                );
            }
        }
    }
}
