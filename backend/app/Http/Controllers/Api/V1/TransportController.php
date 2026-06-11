<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\MasterDataImportRequest;
use App\Http\Requests\TransportRequest;
use App\Models\Transport;
use App\Services\AuditLogService;
use App\Services\MasterDataImportService;
use App\Services\MasterDataImportTemplateService;
use Illuminate\Http\Request;

class TransportController extends CrudController
{
    protected string $modelClass = Transport::class;

    protected string $module = 'transports';

    protected array $searchable = ['nama_layanan', 'kategori'];

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

    public function store(TransportRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Transport $transport)
    {
        return $this->showRecord($transport);
    }

    public function update(TransportRequest $request, Transport $transport)
    {
        return $this->updateRecord($transport, $request->validated());
    }

    public function destroy(Transport $transport)
    {
        return $this->destroyRecord($transport);
    }

    public function previewImport(MasterDataImportRequest $request)
    {
        return $this->success(
            'Preview import transportasi berhasil dibuat',
            $this->masterDataImportService->preview('transports', $request->file('file'))
        );
    }

    public function import(MasterDataImportRequest $request)
    {
        $summary = $this->masterDataImportService->import('transports', $request->file('file'));
        $this->auditLogService->log('transports', 'import', null, 'Import master transportasi dilakukan', $summary);

        return $this->success('Import transportasi selesai', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->masterDataImportTemplateService->generate('transports', $format);

        return response()
            ->download($template['path'], $template['filename'], ['Content-Type' => $template['content_type']])
            ->deleteFileAfterSend(true);
    }
}
