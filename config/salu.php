<?php

return [
    /*
    | Exigir confirmação de e-mail antes de usar a plataforma.
    | Só active com SMTP/serviço de e-mail configurado.
    */
    'require_email_verification' => (bool) env('SALU_REQUIRE_EMAIL_VERIFICATION', false),

    /*
    | Pagamentos simulados (demonstração). Desligado por defeito em produção:
    | com SALU_SIMULATED_PAYMENTS=true qualquer utilizador autenticado pode "pagar" sem dinheiro real.
    */
    'simulated_payments' => (bool) env('SALU_SIMULATED_PAYMENTS', env('APP_ENV', 'production') !== 'production'),

    /*
    | Comissão da plataforma (%) e valor mínimo de levantamento (AOA).
    */
    'platform_fee_percent' => (float) env('SALU_PLATFORM_FEE', 10),
    'min_payout' => (float) env('SALU_MIN_PAYOUT', 5000),

    /*
    | Administrador inicial (usado pelo seeder). Em produção defina ADMIN_PASSWORD;
    | se faltar, é gerada uma palavra-passe aleatória e mostrada uma única vez no log.
    */
    'admin_email' => env('ADMIN_EMAIL', 'admin@salu.ao'),
    'admin_password' => env('ADMIN_PASSWORD'),
];
