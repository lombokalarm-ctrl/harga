<?php

namespace App\Repositories;

use App\Contracts\Repositories\PackageRepositoryInterface;
use App\Models\UmrahPackage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class EloquentPackageRepository implements PackageRepositoryInterface
{
    public function paginate(array $filters): LengthAwarePaginator
    {
        return UmrahPackage::query()
            ->with(['hotelMakkah', 'hotelMadinah', 'airline', 'visa'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('nama_paket', 'like', '%'.$search.'%');
            })
            ->when($filters['status'] ?? null, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate((int) ($filters['per_page'] ?? 10));
    }

    public function findOrFail(int $id): UmrahPackage
    {
        return UmrahPackage::query()
            ->with(['hotelMakkah', 'hotelMadinah', 'airline', 'visa', 'transports', 'guides', 'costComponents', 'itineraryDays', 'agentCommissions.agent', 'snapshots'])
            ->findOrFail($id);
    }

    public function create(array $payload): UmrahPackage
    {
        return DB::transaction(function () use ($payload) {
            $package = UmrahPackage::query()->create(Arr::except($payload, ['transport_ids', 'guide_ids', 'cost_component_ids', 'itinerary_days', 'agent_commissions']));

            $package->transports()->sync($payload['transport_ids'] ?? []);
            $package->guides()->sync($payload['guide_ids'] ?? []);
            $package->costComponents()->sync($payload['cost_component_ids'] ?? []);

            foreach ($payload['itinerary_days'] ?? [] as $day) {
                $package->itineraryDays()->create($day);
            }

            foreach ($payload['agent_commissions'] ?? [] as $commission) {
                $package->agentCommissions()->create($commission);
            }

            return $this->findOrFail((int) $package->id);
        });
    }

    public function update(UmrahPackage $package, array $payload): UmrahPackage
    {
        return DB::transaction(function () use ($package, $payload) {
            $package->update(Arr::except($payload, ['transport_ids', 'guide_ids', 'cost_component_ids', 'itinerary_days', 'agent_commissions']));

            $package->transports()->sync($payload['transport_ids'] ?? []);
            $package->guides()->sync($payload['guide_ids'] ?? []);
            $package->costComponents()->sync($payload['cost_component_ids'] ?? []);

            $package->itineraryDays()->delete();
            foreach ($payload['itinerary_days'] ?? [] as $day) {
                $package->itineraryDays()->create($day);
            }

            $package->agentCommissions()->delete();
            foreach ($payload['agent_commissions'] ?? [] as $commission) {
                $package->agentCommissions()->create($commission);
            }

            return $this->findOrFail((int) $package->id);
        });
    }
}
