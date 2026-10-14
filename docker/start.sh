#!/bin/sh
set -e
cd /var/www/html

# Render define $PORT; o Apache tem de escutar nessa porta.
PORT="${PORT:-10000}"
sed -ri "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

php artisan storage:link --force || true
php artisan config:cache
php artisan route:cache || true
php artisan view:cache || true

# Migrações e dados iniciais (admin, categorias, planos de destaque) — idempotentes.
php artisan migrate --force
php artisan db:seed --force

# Tarefas agendadas (expiração de destaques) no mesmo contentor.
php artisan schedule:work >> storage/logs/schedule.log 2>&1 &

exec apache2-foreground
