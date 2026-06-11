<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\HotelImportRequest;
use App\Http\Requests\HotelRequest;
use App\Models\Hotel;
use App\Services\AuditLogService;
use App\Services\HotelImportService;
use App\Services\HotelImportTemplateService;
use Illuminate\Http\Request;

class HotelController extends CrudController
{
    protected string $modelClass = Hotel::class;

    protected string $module = 'hotels';

    protected array $searchable = ['nama_hotel', 'kota'];

    protected array $filters = ['kota', 'kategori_bintang', 'status'];

    public function __construct(
        AuditLogService $auditLogService,
        private readonly HotelImportService $hotelImportService,
        private readonly HotelImportTemplateService $hotelImportTemplateService,
    ) {
        parent::__construct($auditLogService);
    }

    public function index(Request $request)
    {
        return $this->indexRecords($request);
    }

    public function store(HotelRequest $request)
    {
        return $this->storeRecord($request->validated());
    }

    public function show(Hotel $hotel)
    {
        return $this->showRecord($hotel);
    }

    public function update(HotelRequest $request, Hotel $hotel)
    {
        return $this->updateRecord($hotel, $request->validated());
    }

    public function destroy(Hotel $hotel)
    {
        return $this->destroyRecord($hotel);
    }

    public function import(HotelImportRequest $request)
    {
        $summary = $this->hotelImportService->import($request->file('file'));
        $this->auditLogService->log('hotels', 'import', null, 'Import harga hotel dilakukan', $summary);

        return $this->success('Import harga hotel selesai', $summary);
    }

    public function previewImport(HotelImportRequest $request)
    {
        $summary = $this->hotelImportService->preview($request->file('file'));
        $this->auditLogService->log('hotels', 'preview_import', null, 'Preview import harga hotel dilakukan', [
            'source_file' => $summary['source_file'],
            'total_rows' => $summary['total_rows'],
            'created' => $summary['created'],
            'updated' => $summary['updated'],
            'skipped' => $summary['skipped'],
            'error_count' => count($summary['errors']),
        ]);

        return $this->success('Preview import harga hotel berhasil dibuat', $summary);
    }

    public function downloadTemplate(string $format)
    {
        $format = strtolower($format);
        abort_unless(in_array($format, ['csv', 'xlsx', 'pdf'], true), 404);

        $template = $this->hotelImportTemplateService->generate($format);
        $this->auditLogService->log('hotels', 'download_template', null, 'Template import hotel diunduh', [
            'format' => $format,
            'filename' => $template['filename'],
        ]);

        return response()
            ->download($template['path'], $template['filename'], [
                'Content-Type' => $template['content_type'],
            ])
            ->deleteFileAfterSend(true);
    }
}
