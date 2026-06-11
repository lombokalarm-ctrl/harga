<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\GuideRequest;
use App\Http\Requests\MasterDataImportRequest;
use App\Models\Guide;
use App\Services\AuditLogService;
use App\Services\MasterDataImportService;
use App\Services\MasterDataImportTemplateService;
use Illuminate\Http\Request;

class GuideController extends CrudController
{
    protected string $modelClass = Guide::class;

    protected string $module = 'guides';

    protected array $searchable = ['nama', 'jabatan', 'jenis'];

    protected array $filters = ['jenis'];

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

    public function store(GuideRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Guide $guide)
    {
        return $this->showRecord($guide);
    }

    public function update(GuideRequest $request, Guide $guide)
    {
        return $this->updateRecord($guide, $request->validated());
    }

    public function destroy(Guide $guide)
    {
        return $this->destroyRecord($guide);
    }

    public function previewImport(MasterDataImportRequest $request)
    {
        return $this->success(
            'Preview import pembimbing berhasil dibuat',
            $this->masterDataImportService->preview('guides', $request->file('file'))
        );
    }

    public function import(MasterDataImportRequest $request)
    {
        $summary = $this->masterDataImportService->import('guides', $request->file('file'));
        $this->auditLogService->log('guides', 'import', null, 'Import master pembimbing dilakukan', $summary);

        return $this->success('Import pembimbing selesai', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->masterDataImportTemplateService->generate('guides', $format);

        return response()
            ->download($template['path'], $template['filename'], ['Content-Type' => $template['content_type']])
            ->deleteFileAfterSend(true);
    }
}
