# Salu — Deploy no Render

## 1. Antes de enviar para o GitHub (IMPORTANTE)
O ficheiro `.env` estava versionado no git. Agora está no `.gitignore`, mas continua no histórico:
```bash
git rm --cached .env
git commit -m "Deixa de versionar .env"
```
Se o repositório for (ou foi) público ou partilhado, **troque as credenciais** que estavam no `.env`
(chaves, palavras-passe de base de dados, Stripe, AWS, etc.).

## 2. Criar no Render
1. Render → **New → Blueprint** → escolha o repositório (usa `render.yaml`).
2. Preencha as variáveis marcadas `sync: false`:
   - `APP_KEY` → gere com `php artisan key:generate --show`
   - `APP_URL` → ex.: `https://salu.onrender.com`
   - `ADMIN_PASSWORD` → palavra-passe forte do administrador
3. No primeiro arranque o contentor executa migrações e cria: administrador (`ADMIN_EMAIL`),
   12 categorias e 3 planos de destaque. Painel: `/admin`.

## 3. Limitações do plano gratuito
- **Ficheiros enviados** (documentos KYC, imagens dos anúncios) ficam em disco temporário e perdem-se
  em cada novo deploy/reinício. Para produção use um *Persistent Disk* montado em `/var/www/html/storage/app`
  ou um bucket S3 (`FILESYSTEM_DISK=s3`).
- A base de dados PostgreSQL gratuita do Render expira ao fim de 30 dias.
- O serviço adormece sem tráfego (primeiro pedido lento).
- E-mail: `MAIL_MAILER=log` não envia e-mails reais. Configure SMTP e ponha
  `SALU_REQUIRE_EMAIL_VERIFICATION=true` se quiser confirmação de e-mail.
- Mensagens em tempo real/SMS/WhatsApp e Stripe dependem de credenciais externas (não configuradas).
- Pagamentos simulados (`SALU_SIMULATED_PAYMENTS=true`) são para demonstração: ponha `false` em produção real.

## 4. Local
```bash
composer install && npm install && npm run build
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate --seed
php artisan serve        # admin: admin@salu.ao / admin123456 (só em ambiente local)
php artisan test         # 180 testes
```
