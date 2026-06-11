<?php

namespace App\Services;

use App\Models\Hotel;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use Smalot\PdfParser\Parser as PdfParser;

class HotelImportService
{
    public function preview(UploadedFile $file): array
    {
        return $this->processRows(
            $this->extractRows($file),
            $file->getClientOriginalName(),
            false
        );
    }

    public function import(UploadedFile $file): array
    {
        return $this->processRows(
            $this->extractRows($file),
            $file->getClientOriginalName(),
            true
        );
    }

    private function extractRows(UploadedFile $file): array
    {
        $storedPath = $file->store('hotel-imports');
        $absolutePath = Storage::path($storedPath);
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'xlsx' => $this->readSpreadsheet(new XlsxReader(), $absolutePath),
            'csv' => $this->readSpreadsheet(new CsvReader(), $absolutePath),
            'pdf' => $this->readPdf($absolutePath),
            default => [],
        };
    }

    private function processRows(array $rows, string $sourceFile, bool $persist): array
    {
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
                $payload = $this->normalizeRow($row, $sourceFile);

                if (! $payload) {
                    $summary['skipped']++;
                    $summary['preview_rows'][] = $this->makePreviewRow(
                        $rowNumber,
                        'skip',
                        'Baris dilewati karena `nama_hotel` atau `kota` kosong.',
                        null
                    );
                    continue;
                }

                $this->validatePayload($payload);

                $existingHotel = $this->findExistingHotel($payload);

                $action = $existingHotel ? 'update' : 'create';

                if ($persist) {
                    if ($existingHotel) {
                        $existingHotel->fill($payload)->save();
                    } else {
                        Hotel::query()->create($payload);
                    }
                }

                if ($action === 'create') {
                    $summary['created']++;
                } else {
                    $summary['updated']++;
                }

                $summary['preview_rows'][] = $this->makePreviewRow(
                    $rowNumber,
                    $action,
                    $persist
                        ? ($action === 'create' ? 'Data hotel akan ditambahkan.' : 'Data hotel akan diperbarui.')
                        : ($action === 'create' ? 'Siap diimport sebagai data baru.' : 'Akan menimpa data hotel dengan periode yang sama.'),
                    $payload
                );
            } catch (\Throwable $exception) {
                $summary['errors'][] = 'Baris '.$rowNumber.': '.$exception->getMessage();
                $summary['preview_rows'][] = $this->makePreviewRow(
                    $rowNumber,
                    'error',
                    $exception->getMessage(),
                    null
                );
            }
        }

        return $summary;
    }

    private function readSpreadsheet(object $reader, string $absolutePath): array
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
                    $headers = array_map([$this, 'normalizeHeader'], $cells);
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

    private function readPdf(string $absolutePath): array
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

            if (count(array_filter($parts, fn ($value) => $value !== '')) < 4) {
                continue;
            }

            if ($headers === null) {
                $headers = array_map([$this, 'normalizeHeader'], $parts);
                continue;
            }

            $rows[] = array_combine($headers, array_pad($parts, count($headers), null));
        }

        return $rows;
    }

    private function normalizeHeader(string $header): string
    {
        $header = strtolower(trim($header));
        $map = [
            'hotel' => 'nama_hotel',
            'nama hotel' => 'nama_hotel',
            'city' => 'kota',
            'star' => 'kategori_bintang',
            'bintang' => 'kategori_bintang',
            'double' => 'harga_double',
            'harga double' => 'harga_double',
            'triple' => 'harga_triple',
            'harga triple' => 'harga_triple',
            'quad' => 'harga_quad',
            'quard' => 'harga_quad',
            'harga quad' => 'harga_quad',
            'currency' => 'mata_uang',
            'valid from' => 'valid_from',
            'valid_from' => 'valid_from',
            'valid until' => 'valid_until',
            'valid_until' => 'valid_until',
            'distance' => 'jarak_ke_masjid',
            'jarak' => 'jarak_ke_masjid',
            'photo' => 'foto_url',
            'foto' => 'foto_url',
            'source_file' => 'import_source_file',
        ];

        return $map[$header] ?? str_replace([' ', '-'], '_', $header);
    }

    private function normalizeRow(array $row, string $sourceFile): ?array
    {
        $namaHotel = trim((string) ($row['nama_hotel'] ?? ''));
        $kota = trim((string) ($row['kota'] ?? ''));
        if ($namaHotel === '' || $kota === '') {
            return null;
        }

        $validFrom = $this->normalizeDate(Arr::get($row, 'valid_from'));
        $validUntil = $this->normalizeDate(Arr::get($row, 'valid_until'));

        return [
            'nama_hotel' => $namaHotel,
            'kota' => $kota,
            'kategori_bintang' => (int) ($row['kategori_bintang'] ?? 3),
            'alamat' => $row['alamat'] ?? null,
            'jarak_ke_masjid' => $this->normalizeNumber($row['jarak_ke_masjid'] ?? 0),
            'harga_double' => $this->normalizeNumber($row['harga_double'] ?? 0),
            'harga_triple' => $this->normalizeNumber($row['harga_triple'] ?? 0),
            'harga_quad' => $this->normalizeNumber($row['harga_quad'] ?? 0),
            'mata_uang' => strtoupper((string) ($row['mata_uang'] ?? 'IDR')),
            'valid_from' => $validFrom,
            'valid_until' => $validUntil,
            'status' => $row['status'] ?? 'active',
            'foto_url' => $row['foto_url'] ?? null,
            'import_source_file' => $sourceFile,
        ];
    }

    private function validatePayload(array $payload): void
    {
        if (! in_array($payload['kota'], ['Makkah', 'Madinah'], true)) {
            throw new \InvalidArgumentException('Kota harus Makkah atau Madinah.');
        }

        if (! in_array($payload['mata_uang'], ['IDR', 'USD', 'SAR'], true)) {
            throw new \InvalidArgumentException('Mata uang harus IDR, USD, atau SAR.');
        }

        if (! in_array($payload['status'], ['active', 'inactive'], true)) {
            throw new \InvalidArgumentException('Status harus active atau inactive.');
        }

        if (Carbon::parse($payload['valid_until'])->lt(Carbon::parse($payload['valid_from']))) {
            throw new \InvalidArgumentException('`valid_until` tidak boleh lebih awal dari `valid_from`.');
        }
    }

    private function makePreviewRow(int $rowNumber, string $action, string $message, ?array $payload): array
    {
        return [
            'row_number' => $rowNumber,
            'action' => $action,
            'message' => $message,
            'nama_hotel' => $payload['nama_hotel'] ?? null,
            'kota' => $payload['kota'] ?? null,
            'kategori_bintang' => $payload['kategori_bintang'] ?? null,
            'harga_double' => $payload['harga_double'] ?? null,
            'harga_triple' => $payload['harga_triple'] ?? null,
            'harga_quad' => $payload['harga_quad'] ?? null,
            'mata_uang' => $payload['mata_uang'] ?? null,
            'valid_from' => $payload['valid_from'] ?? null,
            'valid_until' => $payload['valid_until'] ?? null,
            'status' => $payload['status'] ?? null,
        ];
    }

    private function findExistingHotel(array $payload): ?Hotel
    {
        return Hotel::query()
            ->where('nama_hotel', $payload['nama_hotel'])
            ->where('kota', $payload['kota'])
            ->whereDate('valid_from', $payload['valid_from'])
            ->whereDate('valid_until', $payload['valid_until'])
            ->first();
    }

    private function normalizeNumber(mixed $value): float|int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $sanitized = preg_replace('/[^0-9,.-]/', '', (string) $value) ?: '0';
        $sanitized = str_replace(',', '.', $sanitized);

        return (float) $sanitized;
    }

    private function normalizeDate(mixed $value): string
    {
        if ($value === null || $value === '') {
            return now()->toDateString();
        }

        if (is_numeric($value)) {
            return Carbon::createFromTimestampUTC(((int) $value - 25569) * 86400)->toDateString();
        }

        return Carbon::parse((string) $value)->toDateString();
    }
}
