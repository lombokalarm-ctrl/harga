<?php

namespace App\Services;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;

class CurrencyConverter
{
    public function __construct(private readonly ExchangeRateRepositoryInterface $exchangeRates)
    {
    }

    public function toIdr(float $amount, string $currency): float
    {
        $currency = strtoupper($currency);

        if ($currency === 'IDR') {
            return $amount;
        }

        $activeRate = $this->exchangeRates->active();
        if (! $activeRate) {
            return $amount;
        }

        return match ($currency) {
            'USD' => $amount * (float) $activeRate->usd_to_idr,
            'SAR' => $amount * (float) $activeRate->sar_to_idr,
            default => $amount,
        };
    }
}
