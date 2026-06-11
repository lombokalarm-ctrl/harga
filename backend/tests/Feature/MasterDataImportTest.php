<?php

namespace Tests\Feature;

use App\Models\CostComponent;
use App\Models\Guide;
use App\Models\Transport;
use App\Models\User;
use App\Models\Visa;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MasterDataImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_can_preview_airline_import_results(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'airlines-preview.csv',
            implode("\n", [
                'airline,kode,rute,harga tiket,currency,bagasi,valid from,valid until,status',
                'Saudia,SV,CGK-JED-MED-CGK,990,USD,30 kg,2026-01-01,2026-12-31,active',
                'Garuda Indonesia,GA,CGK-JED-CGK,1025,USD,30 kg,2026-09-01,2026-12-31,active',
                ',GA,CGK-JED-CGK,1025,USD,30 kg,2026-09-01,2026-12-31,active',
                'Maskapai Salah,MS,JED-CGK,700,EUR,20 kg,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/airlines/import-preview', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.skipped', 1);

        $this->assertCount(1, $response->json('data.errors'));
        $this->assertSame('update', $response->json('data.preview_rows.0.action'));
        $this->assertSame('create', $response->json('data.preview_rows.1.action'));
    }

    public function test_finance_can_import_guides_from_csv(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'guides-import.csv',
            implode("\n", [
                'nama,jabatan,jenis,fee,mata_uang,maksimal_jamaah,valid_from,valid_until,status',
                'Muthawwif Hasan,Pembimbing Lapangan,muthawwif,2500,SAR,45,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/guides/import', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped', 0);

        $guide = Guide::query()->where('nama', 'Muthawwif Hasan')->firstOrFail();
        $this->assertSame('muthawwif', $guide->jenis);
        $this->assertSame('SAR', $guide->mata_uang);
        $this->assertSame(2500.0, (float) $guide->fee);
    }

    public function test_finance_can_preview_visa_import_results(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'visas-preview.csv',
            implode("\n", [
                'nama visa,harga,currency,masa berlaku,valid from,valid until,status',
                'Visa Umrah Reguler,210,USD,30,2026-01-01,2026-12-31,active',
                'Visa Multiple Entry,325,USD,90,2026-09-01,2026-12-31,active',
                'Visa Tidak Valid,180,EUR,30,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/visas/import-preview', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.skipped', 0);

        $this->assertCount(1, $response->json('data.errors'));
        $this->assertSame('update', $response->json('data.preview_rows.0.action'));
        $this->assertSame('create', $response->json('data.preview_rows.1.action'));
        $this->assertSame('error', $response->json('data.preview_rows.2.action'));
    }

    public function test_finance_can_import_transports_from_csv(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'transports-import.csv',
            implode("\n", [
                'nama_layanan,kategori,harga,mata_uang,valid_from,valid_until,status',
                'Haramain VIP Train,kereta_haramain,450,SAR,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/transports/import', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped', 0);

        $transport = Transport::query()->where('nama_layanan', 'Haramain VIP Train')->firstOrFail();
        $this->assertSame('kereta_haramain', $transport->kategori);
        $this->assertSame('SAR', $transport->mata_uang);
        $this->assertSame(450.0, (float) $transport->harga);
    }

    public function test_finance_can_import_cost_components_from_csv(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'cost-components-import.csv',
            implode("\n", [
                'nama,kategori,harga,mata_uang,is_default,valid_from,valid_until,status',
                'Handling Airport,per_grup,2750,SAR,yes,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/cost-components/import', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped', 0);

        $component = CostComponent::query()->where('nama', 'Handling Airport')->firstOrFail();
        $this->assertSame('per_grup', $component->kategori);
        $this->assertSame('SAR', $component->mata_uang);
        $this->assertTrue($component->is_default);
        $this->assertSame(2750.0, (float) $component->harga);
    }

    public function test_finance_can_download_official_templates_for_all_non_hotel_masters(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $routes = [
            '/api/v1/airlines/import-template/csv' => 'template-import-maskapai.csv',
            '/api/v1/visas/import-template/csv' => 'template-import-visa.csv',
            '/api/v1/transports/import-template/csv' => 'template-import-transportasi.csv',
            '/api/v1/guides/import-template/csv' => 'template-import-pembimbing.csv',
            '/api/v1/cost-components/import-template/csv' => 'template-import-komponen-biaya.csv',
        ];

        foreach ($routes as $route => $filename) {
            $response = $this->get($route);
            $response->assertOk()->assertDownload($filename);
        }
    }
}
