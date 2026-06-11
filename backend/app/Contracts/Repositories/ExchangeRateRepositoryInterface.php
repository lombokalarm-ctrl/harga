<?php

namespace App\Contracts\Repositories;

use App\Models\ExchangeRate;

interface ExchangeRateRepositoryInterface
{
    public function active(): ?ExchangeRate;

    public function activate(ExchangeRate $exchangeRate): ExchangeRate;
}
