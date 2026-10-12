<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Technician;
use App\Models\User;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;

/** Preparação da plataforma após as migrações (corre em cada deploy; é idempotente). */
class SetupSalu extends Command
{
    protected $signature = 'salu:setup';

    protected $description = 'Cria o administrador (ADMIN_EMAIL/ADMIN_PASSWORD) e carrega o catálogo inicial, se ainda não existirem.';

    public function handle(): int
    {
        $this->admin();

        if (config('salu.seed_demo') && Technician::count() === 0) {
            $this->call('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true]);
            $this->warn('Dados de demonstração carregados (admin@salu.ao). Não use em produção real.');
        } elseif (config('salu.seed_catalog') && Category::count() === 0) {
            $this->callSilent('db:seed', ['--class' => CatalogSeeder::class, '--force' => true]);
            $this->info('Catálogo inicial carregado.');
        }

        return self::SUCCESS;
    }

    private function admin(): void
    {
        $email = config('salu.admin_email');
        $password = config('salu.admin_password');

        if (! $email || ! $password) {
            $this->line('ADMIN_EMAIL/ADMIN_PASSWORD não definidos — administrador não criado.');

            return;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            User::create([
                'name' => config('salu.admin_name'),
                'email' => $email,
                'role' => User::ROLE_ADMIN,
                'active' => true,
                'password' => $password,
            ]);
            $this->info("Administrador {$email} criado.");

            return;
        }

        $user->forceFill(['role' => User::ROLE_ADMIN, 'active' => true]);
        if (config('salu.admin_reset_password')) {
            $user->password = $password;
        }
        $user->save();
        $this->line("Administrador {$email} já existia (palavra-passe ".(config('salu.admin_reset_password') ? 'redefinida' : 'mantida').').');
    }
}
