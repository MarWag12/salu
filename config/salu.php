<?php

/** Configuração própria da Salu (lida das variáveis de ambiente, compatível com `config:cache`). */
return [
    // Conta de administrador criada no arranque (php artisan salu:setup). Só é criada se ambos estiverem definidos.
    'admin_name' => env('ADMIN_NAME', 'Administrador Salu'),
    'admin_email' => env('ADMIN_EMAIL'),
    'admin_password' => env('ADMIN_PASSWORD'),
    'admin_reset_password' => (bool) env('ADMIN_RESET_PASSWORD', false),

    // Carrega o catálogo inicial (categorias e serviços) se ainda não existir nenhuma categoria.
    'seed_catalog' => (bool) env('SEED_CATALOG', true),

    // Dados de demonstração (utilizadores/pedidos de exemplo com palavras-passe conhecidas). NUNCA em produção real.
    'seed_demo' => (bool) env('SEED_DEMO_DATA', false),
];
