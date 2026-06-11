<?php

namespace App\Providers;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;
use App\Contracts\Repositories\PackageRepositoryInterface;
use App\Repositories\EloquentExchangeRateRepository;
use App\Repositories\EloquentPackageRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PackageRepositoryInterface::class, EloquentPackageRepository::class);
        $this->app->bind(ExchangeRateRepositoryInterface::class, EloquentExchangeRateRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
