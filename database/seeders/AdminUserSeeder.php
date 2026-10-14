<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the default admin user.
     *
     * Pode ser executado com: php artisan db:seed --class=AdminUserSeeder
     */
    public function run(): void
    {
        // Check if admin already exists
        $adminEmail = config('salu.admin_email');
        $configured = config('salu.admin_password');
        $adminPassword = $configured
            ?: (app()->environment('production') ? \Illuminate\Support\Str::password(16, symbols: false) : 'admin123456');

        if (User::where('email', $adminEmail)->exists()) {
            $this->command->warn('Administrador padrão já existe: ' . $adminEmail);
            return;
        }

        // Create default admin
        $admin = User::create([
            'name' => 'Administrador Salu',
            'email' => $adminEmail,
            'password' => Hash::make($adminPassword),
            'type' => User::TYPE_ADMIN,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════╗');
        $this->command->info('║   ADMINISTRADOR PADRÃO CRIADO!         ║');
        $this->command->info('╚════════════════════════════════════════╝');
        $this->command->info('');
        $this->command->info('Credenciais de acesso:');
        $this->command->info('  URL: /admin');
        $this->command->info('  E-mail: ' . $adminEmail);
        $this->command->info('  Palavra-passe: ' . ($configured ? '(definida em ADMIN_PASSWORD)' : $adminPassword));
        $this->command->info('');
        $this->command->warn('IMPORTANTE: Altere a palavra-passe após o primeiro login!');
        $this->command->info('');
    }
}
