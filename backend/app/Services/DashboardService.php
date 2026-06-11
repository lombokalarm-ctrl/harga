<?php

namespace App\Services;

use App\Models\UmrahPackage;

class DashboardService
{
    public function summary(): array
    {
        $packages = UmrahPackage::query()->with('snapshots')->get();
        $snapshots = $packages->map(fn ($package) => $package->snapshots->first())->filter();

        $totalCost = (float) $snapshots->sum('total_cost');
        $totalProfit = (float) $snapshots->sum('profit_total');
        $totalRevenue = $totalCost + $totalProfit;
        $margin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;
        $averageHpp = $snapshots->count() > 0 ? (float) $snapshots->avg('hpp_per_jamaah') : 0;

        return [
            'cards' => [
                'total_cost' => round($totalCost, 2),
                'total_revenue' => round($totalRevenue, 2),
                'total_profit' => round($totalProfit, 2),
                'profit_margin' => round($margin, 2),
                'hpp' => round($averageHpp, 2),
            ],
            'profit_projection' => $packages->map(function ($package) {
                $snapshot = $package->snapshots->first();
                return [
                    'package' => $package->nama_paket,
                    'profit' => (float) ($snapshot->profit_total ?? 0),
                ];
            })->values()->all(),
            'occupancy_analysis' => $packages->map(function ($package) {
                return [
                    'package' => $package->nama_paket,
                    'jamaah' => $package->target_jamaah,
                ];
            })->values()->all(),
            'cost_composition' => $packages->map(function ($package) {
                $snapshot = $package->snapshots->first();
                return [
                    'package' => $package->nama_paket,
                    'cost' => (float) ($snapshot->total_cost ?? 0),
                ];
            })->values()->all(),
        ];
    }
}
