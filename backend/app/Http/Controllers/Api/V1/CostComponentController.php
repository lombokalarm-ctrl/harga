<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\CostComponentRequest;
use App\Http\Requests\MasterDataImportRequest;
use App\Models\CostComponent;
use App\Services\AuditLogService;
use App\Services\MasterDataImportService;
use App\Services\MasterDataImportTemplateService;
use Illuminate\Http\Request;

class CostComponentController extends CrudController
{
    protected string $modelClass = CostComponent::class;

    protected string $module = 'cost-components';

    protected array $searchable = ['nama', 'kategori'];

    protected array $filters = ['kategori', 'mata_uang'];

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

    public function store(CostComponentRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(CostComponent $costComponent)
    {
        return $this->showRecord($costComponent);
    }

    public function update(CostComponentRequest $request, CostComponent $costComponent)
    {
        return $this->updateRecord($costComponent, $request->validated());
    }

    public function destroy(CostComponent $costComponent)
    {
        return $this->destroyRecord($costComponent);
    }

    public function previewImport(MasterDataImportRequest $request)
    {
        return $this->success(
            'Preview import komponen biaya berhasil dibuat',
            $this->masterDataImportService->preview('cost-components', $request->file('file'))
        );
    }

    public function import(MasterDataImportRequest $request)
    {
        $summary = $this->masterDataImportService->import('cost-components', $request->file('file'));
        $this->auditLogService->log('cost-components', 'import', null, 'Import master komponen biaya dilakukan', $summary);

        return $this->success('Import komponen biaya selesai', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->masterDataImportTemplateService->generate('cost-components', $format);

        return response()
            ->download($template['path'], $template['filename'], ['Content-Type' => $template['content_type']])
            ->deleteFileAfterSend(true);
    }
}
