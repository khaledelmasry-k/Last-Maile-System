#!/usr/bin/env sh
set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

php artisan key:generate --force
php artisan migrate --force
php artisan db:seed --force
php artisan serve --host=0.0.0.0 --port=${PORT:-10000}
