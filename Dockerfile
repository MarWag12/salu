# syntax=docker/dockerfile:1

# ---------- 1) Assets (Vite + React) ----------
FROM node:22-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY vite.config.ts tsconfig.json tailwind.config.js postcss.config.js ./
COPY resources ./resources
COPY public ./public
RUN npm run build

# ---------- 2) Dependências PHP (Composer) ----------
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --prefer-dist \
    --no-scripts --no-autoloader --ignore-platform-reqs

# ---------- 3) Imagem final: PHP 8.3 + Apache ----------
FROM php:8.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev libicu-dev libzip-dev libpng-dev libjpeg-dev libfreetype6-dev unzip \
    && docker-php-ext-configure gd --with-jpeg --with-freetype \
    && docker-php-ext-install -j"$(nproc)" pdo_pgsql pgsql intl zip gd bcmath exif opcache \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-salu.ini
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# O Render define PORT (por omissão 10000); o Apache lê-o do ambiente.
ENV PORT=10000
RUN sed -i 's/^Listen 80$/Listen ${PORT}/' /etc/apache2/ports.conf

WORKDIR /var/www/html
COPY --from=vendor /app/vendor ./vendor
COPY . .
COPY --from=assets /app/public/build ./public/build

RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && (php artisan filament:assets || true) \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 10000
ENTRYPOINT ["entrypoint.sh"]
CMD ["apache2-foreground"]
