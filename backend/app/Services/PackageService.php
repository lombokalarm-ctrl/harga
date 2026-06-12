<?php

namespace App\Services;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;
use App\Contracts\Repositories\PackageRepositoryInterface;
use App\Models\UmrahPackage;

class PackageService
{
    public function __construct(
        private readonly PackageRepositoryInterface $packages,
        private readonly CostingService $costingService,
        private readonly ExchangeRateRepositoryInterface $exchangeRates,
        private readonly AuditLogService $auditLogService,
    ) {
    }

    public function paginate(array $filters)
    {
        return $this->packages->paginate($filters);
    }

    public function find(int $id): UmrahPackage
    {
        return $this->packages->findOrFail($id);
    }

    public function create(array $payload): UmrahPackage
    {
        $package = $this->packages->create($payload);
        $this->storeSnapshot($package);
        $this->auditLogService->log('packages', 'create', $package, 'Paket umrah dibuat');

        return $this->find((int) $package->id);
    }

    public function update(UmrahPackage $package, array $payload): UmrahPackage
    {
        $package = $this->packages->update($package, $payload);
        $this->storeSnapshot($package);
        $this->auditLogService->log('packages', 'update', $package, 'Paket umrah diperbarui');

        return $this->find((int) $package->id);
    }

    public function duplicate(UmrahPackage $package): UmrahPackage
    {
        $payload = $package->only([
            'nama_paket',
            'tanggal_berangkat',
            'durasi_hari',
            'target_jamaah',
            'hotel_makkah_id',
            'hotel_madinah_id',
            'airline_id',
            'visa_id',
            'status',
            'default_margin_percent',
            'target_profit_total',
            'makkah_nights',
            'madinah_nights',
            'room_occupancy',
            'created_by',
            'updated_by',
        ]);
        $payload['nama_paket'] .= ' Copy';
        $payload['status'] = 'draft';
        $payload['transport_ids'] = $package->transports->pluck('id')->all();
        $payload['guide_ids'] = $package->guides->pluck('id')->all();
        $payload['cost_component_ids'] = $package->costComponents->pluck('id')->all();
        $payload['itinerary_days'] = $package->itineraryDays->map(fn ($day) => [
            'hari_ke' => $day->hari_ke,
            'judul' => $day->judul,
            'deskripsi' => $day->deskripsi,
        ])->all();
        $payload['agent_commissions'] = $package->agentCommissions->map(fn ($commission) => [
            'agent_id' => $commission->agent_id,
            'fee_per_jamaah' => $commission->fee_per_jamaah,
            'persentase' => $commission->persentase,
        ])->all();

        return $this->create($payload);
    }

    public function costing(UmrahPackage $package, ?int $jamaah = null, ?float $marginPercent = null, ?float $targetProfit = null): array
    {
        return $this->costingService->calculate($package, $jamaah, $marginPercent, $targetProfit);
    }

    public function simulateOccupancy(UmrahPackage $package, ?float $marginPercent = null, ?float $targetProfit = null): array
    {
        return $this->costingService->simulateOccupancy($package, $marginPercent, $targetProfit);
    }

    public function storeSnapshot(UmrahPackage $package): void
    {
        $freshPackage = $this->find((int) $package->id);
        $costing = $this->costing($freshPackage);

        $freshPackage->snapshots()->create([
            'exchange_rate_id' => $this->exchangeRates->active()?->id,
            'label' => null,
            'notes' => null,
            'is_manual' => false,
            'generated_jamaah' => $costing['jumlah_jamaah'],
            'generated_margin_percent' => $costing['margin_percent'],
            'generated_target_profit_total' => $costing['target_profit_total'],
            'created_by' => $freshPackage->updated_by ?? $freshPackage->created_by,
            'payload_json' => $costing,
            'total_cost' => $costing['total_cost'],
            'hpp_per_jamaah' => $costing['hpp_per_jamaah'],
            'harga_jual_per_jamaah' => $costing['harga_jual_per_jamaah'],
            'profit_total' => $costing['profit_total'],
        ]);
    }

    public function createManualSnapshot(UmrahPackage $package, array $payload, ?int $userId = null)
    {
        $freshPackage = $this->find((int) $package->id);
        $costing = $this->costing(
            $freshPackage,
            isset($payload['jamaah']) ? (int) $payload['jamaah'] : null,
            isset($payload['margin_percent']) ? (float) $payload['margin_percent'] : null,
            isset($payload['target_profit_total']) ? (float) $payload['target_profit_total'] : null,
        );

        $snapshot = $freshPackage->snapshots()->create([
            'exchange_rate_id' => $this->exchangeRates->active()?->id,
            'label' => $payload['label'] ?: 'Snapshot '.now()->format('d M Y H:i'),
            'notes' => $payload['notes'] ?? null,
            'is_manual' => true,
            'generated_jamaah' => $costing['jumlah_jamaah'],
            'generated_margin_percent' => $costing['margin_percent'],
            'generated_target_profit_total' => $costing['target_profit_total'],
            'created_by' => $userId,
            'payload_json' => $costing,
            'total_cost' => $costing['total_cost'],
            'hpp_per_jamaah' => $costing['hpp_per_jamaah'],
            'harga_jual_per_jamaah' => $costing['harga_jual_per_jamaah'],
            'profit_total' => $costing['profit_total'],
        ]);

        $this->auditLogService->log('package_snapshots', 'create', $snapshot, 'Snapshot costing manual dibuat');

        return $snapshot->fresh();
    }
}
