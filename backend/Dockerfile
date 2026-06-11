FROM php:8.4-fpm

RUN apt-get update && apt-get install -y     git     unzip     libpq-dev     libzip-dev     zip     curl     && docker-php-ext-install pdo pdo_pgsql pgsql zip     && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html
COPY . .
RUN composer install --no-interaction

EXPOSE 8000
