<?php

namespace App\Services;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;
use App\Models\UmrahPackage;

class CostingService
{
    public function __construct(
        private readonly CurrencyConverter $currencyConverter,
        private readonly ExchangeRateRepositoryInterface $exchangeRates,
    ) {
    }

    public function calculate(UmrahPackage $package, ?int $jamaah = null, ?float $marginPercent = null, ?float $targetProfit = null): array
    {
        $jamaahCount = max(1, $jamaah ?? $package->target_jamaah);
        $roomOccupancy = in_array((int) ($package->room_occupancy ?? 4), [2, 3, 4], true) ? (int) $package->room_occupancy : 4;
        $roomCount = (int) ceil($jamaahCount / $roomOccupancy);

        $hotelRateMakkah = $package->hotelMakkah->resolveRateByOccupancy($roomOccupancy);
        $hotelRateMadinah = $package->hotelMadinah->resolveRateByOccupancy($roomOccupancy);

        $totalHotel = $this->currencyConverter->toIdr($hotelRateMakkah, $package->hotelMakkah->mata_uang)
            * (int) $package->makkah_nights * $roomCount;
        $totalHotel += $this->currencyConverter->toIdr($hotelRateMadinah, $package->hotelMadinah->mata_uang)
            * (int) $package->madinah_nights * $roomCount;

        $totalTiket = $this->currencyConverter->toIdr((float) $package->airline->harga_tiket, $package->airline->mata_uang) * $jamaahCount;
        $totalVisa = $this->currencyConverter->toIdr((float) $package->visa->harga, $package->visa->mata_uang) * $jamaahCount;

        $totalBiayaJamaah = 0.0;
        $totalBiayaGrup = 0.0;

        foreach ($package->costComponents as $component) {
            $amount = $this->currencyConverter->toIdr((float) $component->harga, $component->mata_uang);
            if ($component->kategori === 'per_jamaah') {
                $totalBiayaJamaah += $amount * $jamaahCount;
            } else {
                $totalBiayaGrup += $amount;
            }
        }

        foreach ($package->transports as $transport) {
            $totalBiayaGrup += $this->currencyConverter->toIdr((float) $transport->harga, $transport->mata_uang);
        }

        foreach ($package->guides as $guide) {
            $totalBiayaGrup += $this->currencyConverter->toIdr((float) $guide->fee, $guide->mata_uang);
        }

        $commissionFlat = 0.0;
        foreach ($package->agentCommissions as $commission) {
            $commissionFlat += ((float) $commission->fee_per_jamaah) * $jamaahCount;
        }

        $totalCostBeforeCommissionPercent = $totalHotel + $totalTiket + $totalVisa + $totalBiayaJamaah + $totalBiayaGrup + $commissionFlat;
        $hpp = $totalCostBeforeCommissionPercent / $jamaahCount;

        $effectiveMargin = $marginPercent ?? (float) ($package->default_margin_percent ?? 0);
        $effectiveTargetProfit = $targetProfit ?? (float) ($package->target_profit_total ?? 0);

        $hargaJualPerJamaah = $hpp;
        if ($effectiveMargin > 0) {
            $hargaJualPerJamaah = $hpp * (1 + ($effectiveMargin / 100));
        } elseif ($effectiveTargetProfit > 0) {
            $hargaJualPerJamaah = $hpp + ($effectiveTargetProfit / $jamaahCount);
        }

        $revenue = $hargaJualPerJamaah * $jamaahCount;
        $commissionPercentAmount = 0.0;
        foreach ($package->agentCommissions as $commission) {
            $commissionPercentAmount += $revenue * ((float) $commission->persentase / 100);
        }

        $totalCost = $totalCostBeforeCommissionPercent + $commissionPercentAmount;
        $hpp = $totalCost / $jamaahCount;
        if ($effectiveMargin > 0) {
            $hargaJualPerJamaah = $hpp * (1 + ($effectiveMargin / 100));
            $revenue = $hargaJualPerJamaah * $jamaahCount;
        } elseif ($effectiveTargetProfit > 0) {
            $hargaJualPerJamaah = $hpp + ($effectiveTargetProfit / $jamaahCount);
            $revenue = $hargaJualPerJamaah * $jamaahCount;
        }

        $profitTotal = $revenue - $totalCost;
        $profitPerJamaah = $hargaJualPerJamaah - $hpp;
        $fixedCost = $totalBiayaGrup;
        $bep = $profitPerJamaah > 0 ? (int) ceil($fixedCost / $profitPerJamaah) : null;
        $activeRate = $this->exchangeRates->active();

        return [
            'jumlah_jamaah' => $jamaahCount,
            'jumlah_kamar' => $roomCount,
            'basis_fare' => match ($roomOccupancy) {
                2 => 'double',
                3 => 'triple',
                default => 'quad',
            },
            'kurs_aktif' => [
                'usd_to_idr' => $activeRate?->usd_to_idr,
                'sar_to_idr' => $activeRate?->sar_to_idr,
            ],
            'total_hotel' => round($totalHotel, 2),
            'total_tiket' => round($totalTiket, 2),
            'total_visa' => round($totalVisa, 2),
            'total_biaya_jamaah' => round($totalBiayaJamaah, 2),
            'total_biaya_grup' => round($totalBiayaGrup, 2),
            'total_komisi' => round($commissionFlat + $commissionPercentAmount, 2),
            'total_cost' => round($totalCost, 2),
            'hpp_per_jamaah' => round($hpp, 2),
            'harga_jual_per_jamaah' => round($hargaJualPerJamaah, 2),
            'profit_total' => round($profitTotal, 2),
            'profit_per_jamaah' => round($profitPerJamaah, 2),
            'break_even_jamaah' => $bep,
            'target_aman' => $bep ? $bep + 5 : null,
            'target_ideal' => $bep ? $bep + 10 : null,
            'margin_percent' => round($effectiveMargin, 2),
            'target_profit_total' => round($effectiveTargetProfit, 2),
        ];
    }

    public function simulateOccupancy(UmrahPackage $package, ?float $marginPercent = null, ?float $targetProfit = null): array
    {
        $rows = [];
        foreach ([10, 15, 20, 25, 30, 35, 40, 45, 50] as $jamaah) {
            $rows[] = $this->calculate($package, $jamaah, $marginPercent, $targetProfit);
        }

        return $rows;
    }
}
