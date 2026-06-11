<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer;

class MasterDataImportTemplateService
{
    public function generate(string $entity, string $format): array
    {
        $definition = $this->definition($entity);

        return match ($format) {
            'csv' => $this->generateCsv($definition),
            'xlsx' => $this->generateXlsx($definition),
            'pdf' => $this->generatePdf($definition),
            default => throw new \InvalidArgumentException('Format template tidak didukung.'),
        };
    }

    private function generateCsv(array $definition): array
    {
        $filePath = $this->makeTemplatePath('csv');
        $handle = fopen($filePath, 'wb');
        fwrite($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $definition['headers']);
        fclose($handle);

        return [
            'path' => $filePath,
            'filename' => $definition['filename_prefix'].'.csv',
            'content_type' => 'text/csv; charset=UTF-8',
        ];
    }

    private function generateXlsx(array $definition): array
    {
        $filePath = $this->makeTemplatePath('xlsx');
        $writer = new Writer();
        $writer->openToFile($filePath);
        $writer->addRow(Row::fromValues($definition['headers']));
        $writer->close();

        return [
            'path' => $filePath,
            'filename' => $definition['filename_prefix'].'.xlsx',
            'content_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
    }

    private function generatePdf(array $definition): array
    {
        $filePath = $this->makeTemplatePath('pdf');

        Pdf::loadView('master-data-import-template', [
            'title' => $definition['title'],
            'headers' => $definition['headers'],
            'sampleRows' => $definition['sample_rows'],
            'fieldGuide' => $definition['field_guide'],
        ])->save($filePath);

        return [
            'path' => $filePath,
            'filename' => $definition['filename_prefix'].'.pdf',
            'content_type' => 'application/pdf',
        ];
    }

    private function definition(string $entity): array
    {
        return match ($entity) {
            'airlines' => [
                'title' => 'Template Import Master Maskapai',
                'filename_prefix' => 'template-import-maskapai',
                'headers' => ['nama_maskapai', 'kode_maskapai', 'rute', 'harga_tiket', 'mata_uang', 'bagasi', 'valid_from', 'valid_until', 'status', 'logo_url'],
                'sample_rows' => [[
                    'nama_maskapai' => 'Saudia',
                    'kode_maskapai' => 'SV',
                    'rute' => 'CGK-JED-MED-CGK',
                    'harga_tiket' => '980',
                    'mata_uang' => 'USD',
                    'bagasi' => '30 kg',
                    'valid_from' => '2026-09-01',
                    'valid_until' => '2026-12-31',
                    'status' => 'active',
                    'logo_url' => '',
                ]],
                'field_guide' => [
                    ['field' => 'nama_maskapai', 'required' => 'Ya', 'example' => 'Saudia', 'notes' => 'Nama maskapai sesuai kontrak.'],
                    ['field' => 'kode_maskapai', 'required' => 'Ya', 'example' => 'SV', 'notes' => 'Gunakan kode IATA maskapai.'],
                    ['field' => 'rute', 'required' => 'Opsional', 'example' => 'CGK-JED-MED-CGK', 'notes' => 'Rute penerbangan paket.'],
                    ['field' => 'harga_tiket', 'required' => 'Ya', 'example' => '980', 'notes' => 'Tarif tiket per jamaah.'],
                    ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'USD', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
                    ['field' => 'bagasi', 'required' => 'Opsional', 'example' => '30 kg', 'notes' => 'Kapasitas bagasi.'],
                    ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive.'],
                    ['field' => 'logo_url', 'required' => 'Opsional', 'example' => 'https://example.com/saudia.png', 'notes' => 'URL logo maskapai jika tersedia.'],
                ],
            ],
            'visas' => [
                'title' => 'Template Import Master Visa',
                'filename_prefix' => 'template-import-visa',
                'headers' => ['nama_visa', 'harga', 'mata_uang', 'masa_berlaku', 'valid_from', 'valid_until', 'status'],
                'sample_rows' => [[
                    'nama_visa' => 'Visa Umrah Reguler',
                    'harga' => '200',
                    'mata_uang' => 'USD',
                    'masa_berlaku' => '30',
                    'valid_from' => '2026-09-01',
                    'valid_until' => '2026-12-31',
                    'status' => 'active',
                ]],
                'field_guide' => [
                    ['field' => 'nama_visa', 'required' => 'Ya', 'example' => 'Visa Umrah Reguler', 'notes' => 'Nama jenis visa.'],
                    ['field' => 'harga', 'required' => 'Ya', 'example' => '200', 'notes' => 'Harga visa per jamaah.'],
                    ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'USD', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
                    ['field' => 'masa_berlaku', 'required' => 'Ya', 'example' => '30', 'notes' => 'Jumlah hari masa berlaku visa.'],
                    ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive.'],
                ],
            ],
            'transports' => [
                'title' => 'Template Import Master Transportasi',
                'filename_prefix' => 'template-import-transportasi',
                'headers' => ['nama_layanan', 'kategori', 'harga', 'mata_uang', 'valid_from', 'valid_until', 'status'],
                'sample_rows' => [[
                    'nama_layanan' => 'Bus Full Trip',
                    'kategori' => 'bus',
                    'harga' => '12000',
                    'mata_uang' => 'SAR',
                    'valid_from' => '2026-09-01',
                    'valid_until' => '2026-12-31',
                    'status' => 'active',
                ]],
                'field_guide' => [
                    ['field' => 'nama_layanan', 'required' => 'Ya', 'example' => 'Bus Full Trip', 'notes' => 'Nama layanan transport.'],
                    ['field' => 'kategori', 'required' => 'Ya', 'example' => 'bus', 'notes' => 'Gunakan bus, kereta_haramain, handling, atau vip_service.'],
                    ['field' => 'harga', 'required' => 'Ya', 'example' => '12000', 'notes' => 'Tarif layanan per grup atau sesuai kontrak.'],
                    ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'SAR', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
                    ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive.'],
                ],
            ],
            'guides' => [
                'title' => 'Template Import Master Pembimbing',
                'filename_prefix' => 'template-import-pembimbing',
                'headers' => ['nama', 'jabatan', 'jenis', 'fee', 'mata_uang', 'maksimal_jamaah', 'valid_from', 'valid_until', 'status'],
                'sample_rows' => [[
                    'nama' => 'Ustadz Ahmad',
                    'jabatan' => 'Pembimbing Ibadah',
                    'jenis' => 'ustadz',
                    'fee' => '12500000',
                    'mata_uang' => 'IDR',
                    'maksimal_jamaah' => '45',
                    'valid_from' => '2026-09-01',
                    'valid_until' => '2026-12-31',
                    'status' => 'active',
                ]],
                'field_guide' => [
                    ['field' => 'nama', 'required' => 'Ya', 'example' => 'Ustadz Ahmad', 'notes' => 'Nama pembimbing.'],
                    ['field' => 'jabatan', 'required' => 'Opsional', 'example' => 'Pembimbing Ibadah', 'notes' => 'Jabatan atau posisi.'],
                    ['field' => 'jenis', 'required' => 'Ya', 'example' => 'ustadz', 'notes' => 'Gunakan muthawwif, tour_leader, atau ustadz.'],
                    ['field' => 'fee', 'required' => 'Ya', 'example' => '12500000', 'notes' => 'Fee pembimbing untuk satu grup.'],
                    ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'IDR', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
                    ['field' => 'maksimal_jamaah', 'required' => 'Ya', 'example' => '45', 'notes' => 'Kapasitas maksimal penugasan.'],
                    ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive.'],
                ],
            ],
            'cost-components' => [
                'title' => 'Template Import Master Komponen Biaya',
                'filename_prefix' => 'template-import-komponen-biaya',
                'headers' => ['nama', 'kategori', 'harga', 'mata_uang', 'is_default', 'valid_from', 'valid_until', 'status'],
                'sample_rows' => [[
                    'nama' => 'Asuransi',
                    'kategori' => 'per_jamaah',
                    'harga' => '150000',
                    'mata_uang' => 'IDR',
                    'is_default' => 'yes',
                    'valid_from' => '2026-09-01',
                    'valid_until' => '2026-12-31',
                    'status' => 'active',
                ]],
                'field_guide' => [
                    ['field' => 'nama', 'required' => 'Ya', 'example' => 'Asuransi', 'notes' => 'Nama komponen biaya.'],
                    ['field' => 'kategori', 'required' => 'Ya', 'example' => 'per_jamaah', 'notes' => 'Gunakan per_jamaah atau per_grup.'],
                    ['field' => 'harga', 'required' => 'Ya', 'example' => '150000', 'notes' => 'Nominal komponen biaya.'],
                    ['field' => 'mata_uang', 'required' => 'Ya', 'example' => 'IDR', 'notes' => 'Gunakan IDR, USD, atau SAR.'],
                    ['field' => 'is_default', 'required' => 'Opsional', 'example' => 'yes', 'notes' => 'Gunakan yes/no atau true/false.'],
                    ['field' => 'valid_from', 'required' => 'Ya', 'example' => '2026-09-01', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'valid_until', 'required' => 'Ya', 'example' => '2026-12-31', 'notes' => 'Format YYYY-MM-DD.'],
                    ['field' => 'status', 'required' => 'Opsional', 'example' => 'active', 'notes' => 'Gunakan active atau inactive.'],
                ],
            ],
            default => throw new \InvalidArgumentException('Template import tidak didukung.'),
        };
    }

    private function makeTemplatePath(string $extension): string
    {
        $directory = storage_path('app/private/templates');
        if (! is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        return $directory.'/master-import-template-'.Str::uuid().'.'.$extension;
    }
}
