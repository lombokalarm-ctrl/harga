<?php

namespace App\Services;

use App\Models\Airline;
use App\Models\CostComponent;
use App\Models\Guide;
use App\Models\Transport;
use App\Models\Visa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use Smalot\PdfParser\Parser as PdfParser;

class MasterDataImportService
{
    public function preview(string $entity, UploadedFile $file): array
    {
        return $this->processRows($entity, $this->extractRows($entity, $file), $file->getClientOriginalName(), false);
    }

    public function import(string $entity, UploadedFile $file): array
    {
        return $this->processRows($entity, $this->extractRows($entity, $file), $file->getClientOriginalName(), true);
    }

    private function extractRows(string $entity, UploadedFile $file): array
    {
        $storedPath = $file->store('master-imports');
        $absolutePath = Storage::path($storedPath);
        $extension = strtolower($file->getClientOriginalExtension());
        $definition = $this->definition($entity);

        return match ($extension) {
            'xlsx' => $this->readSpreadsheet(new XlsxReader(), $absolutePath, $definition['header_map']),
            'csv' => $this->readSpreadsheet(new CsvReader(), $absolutePath, $definition['header_map']),
            'pdf' => $this->readPdf($absolutePath, $definition['header_map']),
            default => [],
        };
    }

    private function processRows(string $entity, array $rows, string $sourceFile, bool $persist): array
    {
        $definition = $this->definition($entity);

        $summary = [
            'source_file' => $sourceFile,
            'total_rows' => count($rows),
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
            'preview_rows' => [],
        ];

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 1;

            try {
                $payload = $this->normalizeRow($entity, $row, $sourceFile);

                if (! $payload) {
                    $summary['skipped']++;
                    $summary['preview_rows'][] = $this->makePreviewRow($definition, $rowNumber, 'skip', 'Baris dilewati karena field utama kosong.', null);
                    continue;
                }

                $this->validatePayload($entity, $payload);

                $modelClass = $definition['model'];
                $existingRecord = $this->findExistingRecord($modelClass, $definition['unique_keys'], $payload);
                $action = $existingRecord ? 'update' : 'create';

                if ($persist) {
                    if ($existingRecord) {
                        $existingRecord->fill($payload)->save();
                    } else {
                        $modelClass::query()->create($payload);
                    }
                }

                if ($action === 'create') {
                    $summary['created']++;
                } else {
                    $summary['updated']++;
                }

                $summary['preview_rows'][] = $this->makePreviewRow(
                    $definition,
                    $rowNumber,
                    $action,
                    $persist
                        ? ($action === 'create' ? 'Data berhasil disiapkan sebagai record baru.' : 'Data berhasil disiapkan untuk update record aktif.')
                        : ($action === 'create' ? 'Siap diimport sebagai data baru.' : 'Akan menimpa data existing pada periode yang sama.'),
                    $payload
                );
            } catch (\Throwable $exception) {
                $summary['errors'][] = 'Baris '.$rowNumber.': '.$exception->getMessage();
                $summary['preview_rows'][] = $this->makePreviewRow($definition, $rowNumber, 'error', $exception->getMessage(), null);
            }
        }

        return $summary;
    }

    private function readSpreadsheet(object $reader, string $absolutePath, array $headerMap): array
    {
        $rows = [];
        $reader->open($absolutePath);

        foreach ($reader->getSheetIterator() as $sheet) {
            $headers = null;
            foreach ($sheet->getRowIterator() as $row) {
                $cells = array_map(
                    static fn ($cell) => is_string($cell) ? trim($cell) : $cell,
                    $row->toArray()
                );

                if ($headers === null) {
                    $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header, $headerMap), $cells);
                    continue;
                }

                if (count(array_filter($cells, fn ($value) => $value !== '')) === 0) {
                    continue;
                }

                $rows[] = array_combine($headers, array_pad($cells, count($headers), null));
            }
        }

        $reader->close();

        return $rows;
    }

    private function readPdf(string $absolutePath, array $headerMap): array
    {
        $parser = new PdfParser();
        $text = $parser->parseFile($absolutePath)->getText();
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        $headers = null;
        $rows = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            if (str_contains($line, '|')) {
                $parts = array_map('trim', explode('|', $line));
            } elseif (str_contains($line, ';')) {
                $parts = array_map('trim', explode(';', $line));
            } elseif (str_contains($line, ',')) {
                $parts = array_map('trim', str_getcsv($line));
            } else {
                $parts = preg_split('/\s{2,}/', $line) ?: [];
                $parts = array_map('trim', $parts);
            }

            if (count(array_filter($parts, fn ($value) => $value !== '')) < 3) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map(fn ($header) => $this->normalizeHeader((string) $header, $headerMap), $parts);
                continue;
            }

            $rows[] = array_combine($headers, array_pad($parts, count($headers), null));
        }

        return $rows;
    }

    private function normalizeHeader(string $header, array $headerMap): string
    {
        $header = strtolower(trim($header));
        $generalMap = [
            'currency' => 'mata_uang',
            'valid from' => 'valid_from',
            'valid until' => 'valid_until',
            'source_file' => 'import_source_file',
        ];

        return $headerMap[$header] ?? $generalMap[$header] ?? str_replace([' ', '-'], '_', $header);
    }

    private function normalizeRow(string $entity, array $row, string $sourceFile): ?array
    {
        return match ($entity) {
            'airlines' => $this->normalizeAirlineRow($row, $sourceFile),
            'visas' => $this->normalizeVisaRow($row, $sourceFile),
            'transports' => $this->normalizeTransportRow($row, $sourceFile),
            'guides' => $this->normalizeGuideRow($row, $sourceFile),
            'cost-components' => $this->normalizeCostComponentRow($row, $sourceFile),
            default => throw new \InvalidArgumentException('Entity import tidak didukung.'),
        };
    }

    private function normalizeAirlineRow(array $row, string $sourceFile): ?array
    {
        $name = trim((string) ($row['nama_maskapai'] ?? ''));
        $code = strtoupper(trim((string) ($row['kode_maskapai'] ?? '')));
        if ($name === '' || $code === '') {
            return null;
        }

        return [
            'nama_maskapai' => $name,
            'kode_maskapai' => $code,
            'rute' => $this->nullableString($row['rute'] ?? null),
            'harga_tiket' => $this->normalizeNumber($row['harga_tiket'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'bagasi' => $this->nullableString($row['bagasi'] ?? null),
            'valid_from' => $this->normalizeDate($row['valid_from'] ?? null),
            'valid_until' => $this->normalizeDate($row['valid_until'] ?? null),
            'status' => strtolower((string) ($row['status'] ?? 'active')),
            'logo_url' => $this->nullableString($row['logo_url'] ?? null),
            'import_source_file' => $sourceFile,
        ];
    }

    private function normalizeVisaRow(array $row, string $sourceFile): ?array
    {
        $name = trim((string) ($row['nama_visa'] ?? ''));
        if ($name === '') {
            return null;
        }

        return [
            'nama_visa' => $name,
            'harga' => $this->normalizeNumber($row['harga'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'masa_berlaku' => (int) ($row['masa_berlaku'] ?? 30),
            'valid_from' => $this->normalizeDate($row['valid_from'] ?? null),
            'valid_until' => $this->normalizeDate($row['valid_until'] ?? null),
            'status' => strtolower((string) ($row['status'] ?? 'active')),
            'import_source_file' => $sourceFile,
        ];
    }

    private function normalizeTransportRow(array $row, string $sourceFile): ?array
    {
        $name = trim((string) ($row['nama_layanan'] ?? ''));
        if ($name === '') {
            return null;
        }

        return [
            'nama_layanan' => $name,
            'kategori' => strtolower((string) ($row['kategori'] ?? 'bus')),
            'harga' => $this->normalizeNumber($row['harga'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'valid_from' => $this->normalizeDate($row['valid_from'] ?? null),
            'valid_until' => $this->normalizeDate($row['valid_until'] ?? null),
            'status' => strtolower((string) ($row['status'] ?? 'active')),
            'import_source_file' => $sourceFile,
        ];
    }

    private function normalizeGuideRow(array $row, string $sourceFile): ?array
    {
        $name = trim((string) ($row['nama'] ?? ''));
        if ($name === '') {
            return null;
        }

        return [
            'nama' => $name,
            'jabatan' => $this->nullableString($row['jabatan'] ?? null),
            'jenis' => strtolower((string) ($row['jenis'] ?? 'ustadz')),
            'fee' => $this->normalizeNumber($row['fee'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'maksimal_jamaah' => (int) ($row['maksimal_jamaah'] ?? 45),
            'valid_from' => $this->normalizeDate($row['valid_from'] ?? null),
            'valid_until' => $this->normalizeDate($row['valid_until'] ?? null),
            'status' => strtolower((string) ($row['status'] ?? 'active')),
            'import_source_file' => $sourceFile,
        ];
    }

    private function normalizeCostComponentRow(array $row, string $sourceFile): ?array
    {
        $name = trim((string) ($row['nama'] ?? ''));
        if ($name === '') {
            return null;
        }

        return [
            'nama' => $name,
            'kategori' => strtolower((string) ($row['kategori'] ?? 'per_jamaah')),
            'harga' => $this->normalizeNumber($row['harga'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'is_default' => $this->normalizeBoolean($row['is_default'] ?? false),
            'valid_from' => $this->normalizeDate($row['valid_from'] ?? null),
            'valid_until' => $this->normalizeDate($row['valid_until'] ?? null),
            'status' => strtolower((string) ($row['status'] ?? 'active')),
            'import_source_file' => $sourceFile,
        ];
    }

    private function validatePayload(string $entity, array $payload): void
    {
        if (! in_array($payload['mata_uang'], ['IDR', 'USD', 'SAR'], true)) {
            throw new \InvalidArgumentException('Mata uang harus IDR, USD, atau SAR.');
        }

        if (! in_array($payload['status'], ['active', 'inactive'], true)) {
            throw new \InvalidArgumentException('Status harus active atau inactive.');
        }

        if (Carbon::parse($payload['valid_until'])->lt(Carbon::parse($payload['valid_from']))) {
            throw new \InvalidArgumentException('`valid_until` tidak boleh lebih awal dari `valid_from`.');
        }

        match ($entity) {
            'visas' => $this->assert($payload['masa_berlaku'] > 0, 'Masa berlaku visa harus lebih dari 0 hari.'),
            'transports' => $this->assert(in_array($payload['kategori'], ['bus', 'kereta_haramain', 'handling', 'vip_service'], true), 'Kategori transport tidak valid.'),
            'guides' => $this->assert(in_array($payload['jenis'], ['muthawwif', 'tour_leader', 'ustadz'], true), 'Jenis pembimbing tidak valid.'),
            'cost-components' => $this->assert(in_array($payload['kategori'], ['per_jamaah', 'per_grup'], true), 'Kategori komponen biaya tidak valid.'),
            default => null,
        };
    }

    private function findExistingRecord(string $modelClass, array $uniqueKeys, array $payload): ?Model
    {
        $query = $modelClass::query();

        foreach ($uniqueKeys as $field) {
            $value = $payload[$field] ?? null;
            if (in_array($field, ['valid_from', 'valid_until'], true)) {
                $query->whereDate($field, $value);
                continue;
            }

            if ($value === null || $value === '') {
                $query->whereNull($field);
                continue;
            }

            $query->where($field, $value);
        }

        return $query->first();
    }

    private function makePreviewRow(array $definition, int $rowNumber, string $action, string $message, ?array $payload): array
    {
        $recordName = null;
        $recordMeta = null;
        $amount = null;
        $currency = null;

        if ($payload) {
            $recordName = $payload[$definition['name_field']] ?? null;
            $recordMeta = $definition['meta_callback']($payload);
            $amount = $payload[$definition['amount_field']] ?? null;
            $currency = $payload['mata_uang'] ?? null;
        }

        return [
            'row_number' => $rowNumber,
            'action' => $action,
            'message' => $message,
            'record_name' => $recordName,
            'record_meta' => $recordMeta,
            'amount_label' => $definition['amount_label'],
            'amount' => $amount,
            'currency' => $currency,
            'valid_from' => $payload['valid_from'] ?? null,
            'valid_until' => $payload['valid_until'] ?? null,
            'status' => $payload['status'] ?? null,
        ];
    }

    private function definition(string $entity): array
    {
        return match ($entity) {
            'airlines' => [
                'model' => Airline::class,
                'name_field' => 'nama_maskapai',
                'amount_field' => 'harga_tiket',
                'amount_label' => 'Harga Tiket',
                'unique_keys' => ['nama_maskapai', 'kode_maskapai', 'rute', 'valid_from', 'valid_until'],
                'meta_callback' => static fn (array $payload) => trim(implode(' | ', array_filter([$payload['kode_maskapai'] ?? null, $payload['rute'] ?? null]))),
                'header_map' => [
                    'airline' => 'nama_maskapai',
                    'maskapai' => 'nama_maskapai',
                    'nama maskapai' => 'nama_maskapai',
                    'kode' => 'kode_maskapai',
                    'airline code' => 'kode_maskapai',
                    'ticket' => 'harga_tiket',
                    'ticket price' => 'harga_tiket',
                    'harga tiket' => 'harga_tiket',
                    'route' => 'rute',
                    'baggage' => 'bagasi',
                    'logo' => 'logo_url',
                ],
            ],
            'visas' => [
                'model' => Visa::class,
                'name_field' => 'nama_visa',
                'amount_field' => 'harga',
                'amount_label' => 'Harga Visa',
                'unique_keys' => ['nama_visa', 'masa_berlaku', 'valid_from', 'valid_until'],
                'meta_callback' => static fn (array $payload) => ($payload['masa_berlaku'] ?? 0).' hari',
                'header_map' => [
                    'visa' => 'nama_visa',
                    'nama visa' => 'nama_visa',
                    'price' => 'harga',
                    'harga visa' => 'harga',
                    'duration' => 'masa_berlaku',
                    'masa berlaku' => 'masa_berlaku',
                ],
            ],
            'transports' => [
                'model' => Transport::class,
                'name_field' => 'nama_layanan',
                'amount_field' => 'harga',
                'amount_label' => 'Harga Layanan',
                'unique_keys' => ['nama_layanan', 'kategori', 'valid_from', 'valid_until'],
                'meta_callback' => static fn (array $payload) => $payload['kategori'] ?? '',
                'header_map' => [
                    'transport' => 'nama_layanan',
                    'nama layanan' => 'nama_layanan',
                    'layanan' => 'nama_layanan',
                    'price' => 'harga',
                    'kategori layanan' => 'kategori',
                ],
            ],
            'guides' => [
                'model' => Guide::class,
                'name_field' => 'nama',
                'amount_field' => 'fee',
                'amount_label' => 'Fee Pembimbing',
                'unique_keys' => ['nama', 'jenis', 'valid_from', 'valid_until'],
                'meta_callback' => static fn (array $payload) => trim(implode(' | ', array_filter([$payload['jenis'] ?? null, $payload['jabatan'] ?? null]))),
                'header_map' => [
                    'guide' => 'nama',
                    'pembimbing' => 'nama',
                    'nama pembimbing' => 'nama',
                    'position' => 'jabatan',
                    'jabatan' => 'jabatan',
                    'role' => 'jenis',
                    'type' => 'jenis',
                    'guide type' => 'jenis',
                    'fee pembimbing' => 'fee',
                    'max jamaah' => 'maksimal_jamaah',
                ],
            ],
            'cost-components' => [
                'model' => CostComponent::class,
                'name_field' => 'nama',
                'amount_field' => 'harga',
                'amount_label' => 'Harga Komponen',
                'unique_keys' => ['nama', 'kategori', 'valid_from', 'valid_until'],
                'meta_callback' => static fn (array $payload) => $payload['kategori'] ?? '',
                'header_map' => [
                    'component' => 'nama',
                    'cost component' => 'nama',
                    'komponen biaya' => 'nama',
                    'price' => 'harga',
                    'default' => 'is_default',
                ],
            ],
            default => throw new \InvalidArgumentException('Entity import tidak didukung.'),
        };
    }

    private function normalizeNumber(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        $sanitized = preg_replace('/[^0-9,.-]/', '', (string) $value) ?: '0';
        $sanitized = str_replace(',', '.', $sanitized);

        return (float) $sanitized;
    }

    private function normalizeDate(mixed $value): string
    {
        if ($value === null || $value === '') {
            throw new \InvalidArgumentException('Kolom tanggal wajib diisi.');
        }

        if (is_numeric($value)) {
            return Carbon::createFromTimestampUTC(((int) $value - 25569) * 86400)->toDateString();
        }

        return Carbon::parse((string) $value)->toDateString();
    }

    private function normalizeBoolean(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'ya'], true);
    }

    private function nullableString(mixed $value): ?string
    {
        $value = trim((string) ($value ?? ''));

        return $value === '' ? null : $value;
    }

    private function assert(bool $condition, string $message): void
    {
        if (! $condition) {
            throw new \InvalidArgumentException($message);
        }
    }
}
