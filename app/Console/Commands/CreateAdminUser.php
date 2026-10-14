<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin
                            {--name= : Nome do administrador}
                            {--email= : E-mail do administrador}
                            {--password= : Palavra-passe (opcional, será solicitada se não fornecida)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Criar um novo utilizador administrador para o painel Filament';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('');
        $this->info('╔════════════════════════════════════════╗');
        $this->info('║     CRIAR ADMINISTRADOR - SALU         ║');
        $this->info('╚════════════════════════════════════════╝');
        $this->info('');

        // Get or ask for name
        $name = $this->option('name') ?: $this->ask('Nome completo do administrador');

        // Get or ask for email
        $email = $this->option('email') ?: $this->ask('E-mail do administrador');

        // Validate email
        $validator = Validator::make(['email' => $email], [
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            $this->error('');
            $this->error('Erro de validação:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('  - ' . $error);
            }
            return Command::FAILURE;
        }

        // Get or ask for password
        $password = $this->option('password') ?: $this->secret('Palavra-passe (mínimo 8 caracteres)');

        if (strlen($password) < 8) {
            $this->error('');
            $this->error('A palavra-passe deve ter pelo menos 8 caracteres.');
            return Command::FAILURE;
        }

        // Confirm password if entered interactively
        if (!$this->option('password')) {
            $passwordConfirmation = $this->secret('Confirmar palavra-passe');

            if ($password !== $passwordConfirmation) {
                $this->error('');
                $this->error('As palavras-passe não coincidem.');
                return Command::FAILURE;
            }
        }

        // Show summary and confirm
        $this->info('');
        $this->info('Resumo do novo administrador:');
        $this->table(
            ['Campo', 'Valor'],
            [
                ['Nome', $name],
                ['E-mail', $email],
                ['Tipo', 'Administrador'],
            ]
        );

        if (!$this->confirm('Deseja criar este administrador?', true)) {
            $this->warn('Operação cancelada.');
            return Command::SUCCESS;
        }

        // Create the admin user
        try {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'type' => User::TYPE_ADMIN,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            $this->info('');
            $this->info('╔════════════════════════════════════════╗');
            $this->info('║   ADMINISTRADOR CRIADO COM SUCESSO!    ║');
            $this->info('╚════════════════════════════════════════╝');
            $this->info('');
            $this->info('Detalhes de acesso:');
            $this->info('  URL: ' . url('/admin'));
            $this->info('  E-mail: ' . $email);
            $this->info('  Palavra-passe: (a que definiu)');
            $this->info('');
            $this->warn('Guarde estas informações em local seguro!');
            $this->info('');

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('');
            $this->error('Erro ao criar administrador: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
