<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HotelImportTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_can_download_csv_template(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->get('/api/v1/hotels/import-template/csv');

        $response
            ->assertOk()
            ->assertDownload('template-import-hotel.csv');

        $contents = file_get_contents($response->baseResponse->getFile()->getPathname());

        $this->assertStringContainsString('nama_hotel,kota,kategori_bintang,alamat,jarak_ke_masjid,harga_double,harga_triple,harga_quad,mata_uang,valid_from,valid_until,status,foto_url', $contents);
    }

    public function test_finance_can_download_xlsx_and_pdf_templates(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $xlsxResponse = $this->get('/api/v1/hotels/import-template/xlsx');
        $xlsxResponse
            ->assertOk()
            ->assertDownload('template-import-hotel.xlsx');

        $pdfResponse = $this->get('/api/v1/hotels/import-template/pdf');
        $pdfResponse
            ->assertOk()
            ->assertDownload('template-import-hotel.pdf');
    }
}
