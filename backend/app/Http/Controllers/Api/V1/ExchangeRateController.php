<?php

namespace App\Http\Controllers\Api\V1;

use App\Contracts\Repositories\ExchangeRateRepositoryInterface;
use App\Http\Controllers\Api\V1\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExchangeRateRequest;
use App\Http\Resources\EntityResource;
use App\Models\ExchangeRate;
use App\Models\UmrahPackage;
use App\Services\AuditLogService;
use App\Services\PackageService;
use Illuminate\Http\Request;

class ExchangeRateController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ExchangeRateRepositoryInterface $exchangeRates,
        private readonly PackageService $packageService,
        private readonly AuditLogService $auditLogService,
    ) {
    }

    public function index(Request $request)
    {
        $paginator = ExchangeRate::query()->latest('effective_at')->paginate((int) $request->integer('per_page', 10));

        return $this->success('Data kurs berhasil diambil', EntityResource::collection($paginator->items()), [
            'page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(ExchangeRateRequest $request)
    {
        $exchangeRate = ExchangeRate::query()->create([
            ...$request->validated(),
            'created_by' => $request->user()?->id,
        ]);

        if ($request->boolean('is_active', true)) {
            $this->exchangeRates->activate($exchangeRate);
        }

        $this->auditLogService->log('exchange-rates', 'create', $exchangeRate, 'Kurs baru ditambahkan');

        return $this->success('Kurs berhasil disimpan', new EntityResource($exchangeRate->fresh()));
    }

    public function current()
    {
        return $this->success('Kurs aktif berhasil diambil', $this->exchangeRates->active());
    }

    public function recalculate()
    {
        UmrahPackage::query()->get()->each(fn ($package) => $this->packageService->storeSnapshot($package));

        return $this->success('Recalculate paket selesai');
    }
}
