#!/bin/sh
set -e
cd /var/www/html

if [ -z "$APP_KEY" ]; then
    echo "ERRO: defina a variável APP_KEY no Render (ex.: base64:... gerada com 'openssl rand -base64 32')." >&2
    exit 1
fi

# O Render injecta o URL público do serviço; usa-o se APP_URL não foi definido.
if [ -z "$APP_URL" ] && [ -n "$RENDER_EXTERNAL_URL" ]; then
    export APP_URL="$RENDER_EXTERNAL_URL"
fi

mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

php artisan storage:link --force >/dev/null 2>&1 || true

# Migrações (com repetição: a base de dados pode demorar alguns segundos a aceitar ligações).
i=0
until php artisan migrate --force; do
    i=$((i + 1))
    if [ "$i" -ge 10 ]; then
        echo "ERRO: não foi possível executar as migrações." >&2
        exit 1
    fi
    echo "A aguardar a base de dados ($i/10)..."
    sleep 3
done

php artisan salu:setup

php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true
php artisan event:cache || true

chown -R www-data:www-data storage bootstrap/cache

exec "$@"
