<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\AirlineRequest;
use App\Http\Requests\MasterDataImportRequest;
use App\Models\Airline;
use App\Services\AuditLogService;
use App\Services\MasterDataImportService;
use App\Services\MasterDataImportTemplateService;
use Illuminate\Http\Request;

class AirlineController extends CrudController
{
    protected string $modelClass = Airline::class;

    protected string $module = 'airlines';

    protected array $searchable = ['nama_maskapai', 'kode_maskapai', 'rute'];

    protected array $filters = ['status', 'mata_uang'];

    public function __construct(
        AuditLogService $auditLogService,
        private readonly MasterDataImportService $masterDataImportService,
        private readonly MasterDataImportTemplateService $masterDataImportTemplateService,
    )
    {
        parent::__construct($auditLogService);
    }

    public function index(Request $request)
    {
        return $this->indexRecords($request);
    }

    public function store(AirlineRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Airline $airline)
    {
        return $this->showRecord($airline);
    }

    public function update(AirlineRequest $request, Airline $airline)
    {
        return $this->updateRecord($airline, $request->validated());
    }

    public function destroy(Airline $airline)
    {
        return $this->destroyRecord($airline);
    }

    public function previewImport(MasterDataImportRequest $request)
    {
        return $this->success(
            'Preview import maskapai berhasil dibuat',
            $this->masterDataImportService->preview('airlines', $request->file('file'))
        );
    }

    public function import(MasterDataImportRequest $request)
    {
        $summary = $this->masterDataImportService->import('airlines', $request->file('file'));
        $this->auditLogService->log('airlines', 'import', null, 'Import master maskapai dilakukan', $summary);

        return $this->success('Import maskapai selesai', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->masterDataImportTemplateService->generate('airlines', $format);

        return response()
            ->download($template['path'], $template['filename'], ['Content-Type' => $template['content_type']])
            ->deleteFileAfterSend(true);
    }
}
