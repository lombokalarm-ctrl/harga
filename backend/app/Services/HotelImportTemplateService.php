<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

class HotelImportTemplateService
{
    public function generate(string $format): array
    {
        return match ($format) {
            'csv' => $this->generateCsv(),
            'xlsx' => $this->generateXlsx(),
            'pdf' => $this->generatePdf(),
            default => throw new \InvalidArgumentException('Format template tidak didukung.'),
        };
    }

    public function headers(): array
    {
        return [
            'nama_hotel',
            'kota',
            'kategori_bintang',
            'alamat',
            'jarak_ke_masjid',
            'harga_double',
            'harga_triple',
            'harga_quad',
            'mata_uang',
            'valid_from',
            'valid_until',
            'status',
            'foto_url',
        ];
    }

    public function sampleRows(): array
    {
        return [
            [
                'nama_hotel' => 'Anjum Makkah',
                'kota' => 'Makkah',
                'kategori_bintang' => 5,
                'alamat' => 'Ibrahim Al Khalil Street',
                'jarak_ke_masjid' => 350,
                'harga_double' => 210,
                'harga_triple' => 185,
                'harga_quad' => 170,
                'mata_uang' => 'USD',
                'valid_from' => '2026-09-01',
                'valid_until' => '2026-12-31',
                'status' => 'active',
                'foto_url' => '',
            ],
            [
                'nama_hotel' => 'Saja Al Madinah',
                'kota' => 'Madinah',
                'kategori_bintang' => 4,
                'alamat' => 'King Faisal Road',
                'jarak_ke_masjid' => 500,
                'harga_double' => 169,
                'harga_triple' => 146,
                'harga_quad' => 129,
                'mata_uang' => 'USD',
                'valid_from' => '2026-09-01',
                'valid_until' => '2026-12-31',
                'status' => 'active',
                'foto_url' => '',
            ],
        ];
    }

    public function fieldGuide(): array
    {
        return [
            ['field' => 'nama_hotel', 'required' => 'Ya', 'example' => 'Anjum Makkah', 'notes' => 'Nama hotel sesuai kontrak atau rate sheet vendor.'],
            ['field' => 'kota', 'required' => 'Ya', 'example' => 'Makkah', 'notes' => 'Gunakan Makkah atau Madinah.'],
            ['field' => 'kategori_bintang', 'required' => 'Ya', 'example' => '5', 'notes' => 'Isi 3, 4, atau 5 sesuai klasifikasi hotel.'],
            ['field' => 'alamat', 'required' => 'Opsional', 'example' => 'Ibrahim Al Khalil Street', 'notes' => 'Boleh dikosongkan jika belum tersedia.'],
            ['field' => 'jarak_ke_masjid', 'required' => 'Opsional', 'example' => '350', 'notes' => 'Isi dalam meter tanpa titik pemisah ribuan.'],
            ['field' => 'harga_double', 'required' => 'Ya', 'example' => '210', 'notes' => 'Fare per kamar per malam untuk okupansi 2 pax.'],
            ['field' => 'harga_triple', 'required' => 'Ya', 'example' => '185', 'notes' => 'Fare per kamar per malam untuk okupansi 3 pax.'],
            ['field' => 'harga_quad', 'required' => 'Ya', 'example' => '170', 'notes' => 'Fare per kamar per malam untuk okupansi 4 pax.'],
            ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'USD', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
            ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format tanggal wajib YYYY-MM-DD.'],
            ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format tanggal wajib YYYY-MM-DD dan tidak boleh sebelum valid_from.'],
            ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive. Default active jika kosong.'],
            ['field' => 'foto_url', 'required' => 'Opsional', 'example' => 'https://example.com/anjum.jpg', 'notes' => 'URL foto hotel jika tersedia.'],
        ];
    }

    private function generateCsv(): array
    {
        $filePath = $this->makeTemplatePath('csv');
        $handle = fopen($filePath, 'wb');

        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $this->headers());
        fclose($handle);

        return [
            'path' => $filePath,
            'filename' => 'template-import-hotel.csv',
            'content_type' => 'text/csv; charset=UTF-8',
        ];
    }

    private function generateXlsx(): array
    {
        $filePath = $this->makeTemplatePath('xlsx');

        $writer = new Writer();
        $writer->openToFile($filePath);
        $writer->addRow(Row::fromValues($this->headers()));
        $writer->close();

        return [
            'path' => $filePath,
            'filename' => 'template-import-hotel.xlsx',
            'content_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
    }

    private function generatePdf(): array
    {
        $filePath = $this->makeTemplatePath('pdf');

        Pdf::loadView('hotel-import-template', [
            'headers' => $this->headers(),
            'sampleRows' => $this->sampleRows(),
            'fieldGuide' => $this->fieldGuide(),
        ])->save($filePath);

        return [
            'path' => $filePath,
            'filename' => 'template-import-hotel.pdf',
            'content_type' => 'application/pdf',
        ];
    }

    private function makeTemplatePath(string $extension): string
    {
        $directory = storage_path('app/private/templates');
        if (! is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        return $directory.'/hotel-import-template-'.Str::uuid().'.'.$extension;
    }
}
