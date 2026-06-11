<?php

namespace App\Repositories;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\DB;

class EloquentExchangeRateRepository implements ExchangeRateRepositoryInterface
{
    public function active(): ?ExchangeRate
    {
        return ExchangeRate::query()->where('is_active', true)->latest('effective_at')->first();
    }

    public function activate(ExchangeRate $exchangeRate): ExchangeRate
    {
        DB::transaction(function () use ($exchangeRate) {
            ExchangeRate::query()->update(['is_active' => false]);
            $exchangeRate->update(['is_active' => true]);
        });

        return $exchangeRate->fresh();
    }
}
