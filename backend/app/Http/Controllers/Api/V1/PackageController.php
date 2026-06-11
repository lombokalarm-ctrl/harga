<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PackageRequest;
use App\Http\Requests\PackageSimulationRequest;
use App\Http\Resources\PackageResource;
use App\Models\UmrahPackage;
use App\Services\PackageService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

class PackageController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly PackageService $packageService)
    {
    }

    public function index(Request $request)
    {
        $paginator = $this->packageService->paginate($request->all());

        return $this->success('Paket berhasil diambil', PackageResource::collection($paginator->items()), [
            'page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(PackageRequest $request)
    {
        $payload = [
            ...$request->validated(),
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ];

        $package = $this->packageService->create($payload);

        return $this->success('Paket berhasil dibuat', new PackageResource($package));
    }

    public function show(UmrahPackage $package)
    {
        return $this->success('Detail paket berhasil diambil', new PackageResource($this->packageService->find((int) $package->id)));
    }

    public function update(PackageRequest $request, UmrahPackage $package)
    {
        $payload = [
            ...$request->validated(),
            'updated_by' => $request->user()?->id,
        ];

        $package = $this->packageService->update($package, $payload);

        return $this->success('Paket berhasil diperbarui', new PackageResource($package));
    }

    public function destroy(UmrahPackage $package)
    {
        $package->delete();

        return $this->success('Paket berhasil dihapus');
    }

    public function duplicate(UmrahPackage $package)
    {
        $package = $this->packageService->duplicate($this->packageService->find((int) $package->id));

        return $this->success('Paket berhasil diduplikasi', new PackageResource($package));
    }

    public function publish(UmrahPackage $package)
    {
        $package->update(['status' => 'published']);
        $this->packageService->storeSnapshot($package);

        return $this->success('Paket berhasil dipublish', new PackageResource($this->packageService->find((int) $package->id)));
    }

    public function costing(PackageSimulationRequest $request, UmrahPackage $package)
    {
        return $this->success('Costing berhasil dihitung', $this->packageService->costing(
            $this->packageService->find((int) $package->id),
            $request->integer('jamaah') ?: null,
            $request->input('margin_percent'),
            $request->input('target_profit_total'),
        ));
    }

    public function occupancy(PackageSimulationRequest $request, UmrahPackage $package)
    {
        return $this->success('Simulasi okupansi berhasil dihitung', $this->packageService->simulateOccupancy(
            $this->packageService->find((int) $package->id),
            $request->input('margin_percent'),
            $request->input('target_profit_total'),
        ));
    }

    public function bep(PackageSimulationRequest $request, UmrahPackage $package)
    {
        $costing = $this->packageService->costing(
            $this->packageService->find((int) $package->id),
            $request->integer('jamaah') ?: null,
            $request->input('margin_percent'),
            $request->input('target_profit_total'),
        );

        return $this->success('BEP berhasil dihitung', [
            'minimal_jamaah' => $costing['break_even_jamaah'],
            'target_aman' => $costing['target_aman'],
            'target_ideal' => $costing['target_ideal'],
            'profit_per_jamaah' => $costing['profit_per_jamaah'],
        ]);
    }

    public function proposalPdf(UmrahPackage $package)
    {
        $package = $this->packageService->find((int) $package->id);
        $costing = $this->packageService->costing($package);
        $pdf = Pdf::loadView('proposal', [
            'package' => $package,
            'costing' => $costing,
        ]);

        return $pdf->download('proposal-'.$package->id.'.pdf');
    }

    public function proposalSpreadsheet(UmrahPackage $package)
    {
        $package = $this->packageService->find((int) $package->id);
        $costing = $this->packageService->costing($package);
        $filePath = storage_path('app/private/proposal-'.$package->id.'.xlsx');

        if (! is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0777, true);
        }

        $writer = new Writer();
        $writer->openToFile($filePath);
        $writer->addRow(Row::fromValues(['Nama Paket', $package->nama_paket]));
        $writer->addRow(Row::fromValues(['Durasi', $package->durasi_hari]));
        $writer->addRow(Row::fromValues(['Target Jamaah', $package->target_jamaah]));
        foreach ($costing as $key => $value) {
            if (is_array($value)) {
                continue;
            }
            $writer->addRow(Row::fromValues([$key, $value]));
        }
        $writer->close();

        return response()->download($filePath)->deleteFileAfterSend(true);
    }
}
