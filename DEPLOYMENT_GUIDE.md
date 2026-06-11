# Deployment Guide

## Ringkasan
Aplikasi terdiri dari dua service utama:
- `backend`: Laravel 12 REST API + Sanctum + PostgreSQL
- `frontend`: React + TypeScript + Vite

## 1. Persiapan Server Ubuntu
```bash
sudo apt update
sudo apt install -y nginx git unzip curl postgresql-client supervisor
```

## 2. Install PHP 8.4 dan Ekstensi
```bash
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.4 php8.4-fpm php8.4-cli php8.4-pgsql php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-bcmath
```

## 3. Install Node.js 24 dan Composer
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
sudo mv composer.phar /usr/local/bin/composer
```

## 4. Deploy Source Code
```bash
git clone <repo-url> /var/www/umrah-costing-engine
cd /var/www/umrah-costing-engine/backend
cp .env.example .env
composer install --no-interaction --optimize-autoloader
php artisan key:generate
```

## 5. Konfigurasi Environment Backend
Atur `.env` backend menjadi PostgreSQL production:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=umrah_costing_engine
DB_USERNAME=postgres
DB_PASSWORD=strong-password
```

## 6. Migrasi dan Seeder
```bash
cd /var/www/umrah-costing-engine/backend
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
```

## 7. Build Frontend
```bash
cd /var/www/umrah-costing-engine/frontend
npm install
npm run build
```

## 8. Konfigurasi PHP-FPM dan Nginx
- Letakkan file `infra/nginx/umrah-costing-engine.conf` ke `/etc/nginx/sites-available/umrah-costing-engine`
- Ubah `server_name` sesuai domain
- Aktifkan site:
```bash
sudo ln -s /etc/nginx/sites-available/umrah-costing-engine /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Jalankan Backend sebagai Service
Contoh Supervisor untuk Laravel API:
```ini
[program:umrah-backend]
command=/usr/bin/php /var/www/umrah-costing-engine/backend/artisan serve --host=127.0.0.1 --port=8000
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/supervisor/umrah-backend.log
```

## 10. Queue dan Scheduler
Jika memakai queue/export asinkron:
```bash
* * * * * cd /var/www/umrah-costing-engine/backend && php artisan schedule:run >> /dev/null 2>&1
```

## 11. Deploy dengan Docker Compose
Untuk environment lokal atau staging:
```bash
docker compose up --build
```

## 12. Akun Dummy Seeder
- `admin@umrah.test` / `password`
- `finance@umrah.test` / `password`
- `marketing@umrah.test` / `password`
- `director@umrah.test` / `password`
