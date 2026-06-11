<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\MasterDataImportRequest;
use App\Http\Requests\VisaRequest;
use App\Models\Visa;
use App\Services\AuditLogService;
use App\Services\MasterDataImportService;
use App\Services\MasterDataImportTemplateService;
use Illuminate\Http\Request;

class VisaController extends CrudController
{
    protected string $modelClass = Visa::class;

    protected string $module = 'visas';

    protected array $searchable = ['nama_visa'];

    protected array $filters = ['mata_uang'];

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

    public function store(VisaRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Visa $visa)
    {
        return $this->showRecord($visa);
    }

    public function update(VisaRequest $request, Visa $visa)
    {
        return $this->updateRecord($visa, $request->validated());
    }

    public function destroy(Visa $visa)
    {
        return $this->destroyRecord($visa);
    }

    public function previewImport(MasterDataImportRequest $request)
    {
        return $this->success(
            'Preview import visa berhasil dibuat',
            $this->masterDataImportService->preview('visas', $request->file('file'))
        );
    }

    public function import(MasterDataImportRequest $request)
    {
        $summary = $this->masterDataImportService->import('visas', $request->file('file'));
        $this->auditLogService->log('visas', 'import', null, 'Import master visa dilakukan', $summary);

        return $this->success('Import visa selesai', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->masterDataImportTemplateService->generate('visas', $format);

        return response()
            ->download($template['path'], $template['filename'], ['Content-Type' => $template['content_type']])
            ->deleteFileAfterSend(true);
    }
}
