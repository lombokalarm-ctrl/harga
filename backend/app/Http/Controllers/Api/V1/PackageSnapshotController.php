<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PackageSnapshotStoreRequest;
use App\Http\Requests\PackageSnapshotUpdateRequest;
use App\Http\Resources\PackageSnapshotResource;
use App\Models\PackageSnapshot;
use App\Models\UmrahPackage;
use App\Services\PackageService;

class PackageSnapshotController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PackageService $packageService)
    {
    }

    public function index(UmrahPackage $package)
    {
        $snapshots = $package->snapshots()
            ->where('is_manual', true)
            ->get();

        return $this->success('Snapshot costing berhasil diambil', PackageSnapshotResource::collection($snapshots));
    }

    public function store(PackageSnapshotStoreRequest $request, UmrahPackage $package)
    {
        $snapshot = $this->packageService->createManualSnapshot(
            $this->packageService->find((int) $package->id),
            $request->validated(),
            $request->user()?->id
        );

        return $this->success('Snapshot costing berhasil disimpan', new PackageSnapshotResource($snapshot));
    }

    public function update(PackageSnapshotUpdateRequest $request, UmrahPackage $package, PackageSnapshot $snapshot)
    {
        abort_unless((int) $snapshot->umrah_package_id === (int) $package->id, 404);
        abort_unless((bool) $snapshot->is_manual, 422, 'Snapshot sistem tidak bisa diubah.');

        $snapshot->update($request->validated());

        return $this->success('Snapshot costing berhasil diperbarui', new PackageSnapshotResource($snapshot->fresh()));
    }

    public function destroy(UmrahPackage $package, PackageSnapshot $snapshot)
    {
        abort_unless((int) $snapshot->umrah_package_id === (int) $package->id, 404);
        abort_unless((bool) $snapshot->is_manual, 422, 'Snapshot sistem tidak bisa dihapus.');

        $snapshot->delete();

        return $this->success('Snapshot costing berhasil dihapus');
    }
}
