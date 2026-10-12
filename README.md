<p align="center"><img src="public/images/salu-logo.png" alt="Salu — Gestão de Manutenção Doméstica" width="220"></p>

# Salu — Gestão de Manutenção Doméstica

Plataforma que liga clientes a técnicos de manutenção doméstica verificados (KYC).
**Stack:** Laravel 12 · Inertia + React (Mantine/Tailwind) · Filament 3 (painel `/admin`) · PostgreSQL.

## Desenvolvimento local

```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite
php artisan migrate && php artisan salu:setup   # defina ADMIN_EMAIL/ADMIN_PASSWORD no .env para criar o admin
npm run dev & php artisan serve
```

Dados de demonstração (utilizadores e pedidos de exemplo): `SEED_DEMO_DATA=true php artisan salu:setup`
(cria `admin@salu.ao` / `Admin@2026`, técnicos `*@salu.ao` / `Tecnico@2026`, clientes `*@exemplo.ao` / `Cliente@2026`).

## Deploy no Render

1. Envie o projecto para o GitHub.
2. Gere a chave da aplicação: `echo "base64:$(openssl rand -base64 32)"`
3. No Render: **New → Blueprint** → escolha o repositório (usa `render.yaml`: serviço web em Docker + PostgreSQL).
4. Preencha as variáveis pedidas: `APP_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (`APP_URL` é opcional).
5. Depois do deploy: site em `https://<nome>.onrender.com` e painel em `/admin`.

A cada deploy o contentor executa `migrate`, `salu:setup` (cria o admin e o catálogo inicial se ainda não existirem) e as caches do Laravel.

### Limitações do plano grátis
- **Ficheiros enviados** (documentos KYC, imagens) ficam no disco do contentor e perdem-se em cada deploy/reinício. Para produção adicione um *Persistent Disk* montado em `/var/www/html/storage/app` (plano pago) ou configure S3 (`FILESYSTEM_DISK=s3` + `AWS_*`).
- A base de dados grátis expira ao fim de 30 dias; o serviço grátis adormece sem tráfego.
- **E-mail:** `MAIL_MAILER=log` (a recuperação de palavra-passe só escreve no log). Configure SMTP (`MAIL_MAILER=smtp`, `MAIL_HOST`, …) para enviar e-mails.
- **Tempo real** (Reverb) vem desligado (`BROADCAST_CONNECTION=log`); o resto da plataforma funciona normalmente.
