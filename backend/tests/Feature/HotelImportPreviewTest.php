<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HotelImportPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_can_preview_hotel_import_results(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'hotel-preview.csv',
            implode("\n", [
                'hotel,city,star,double,triple,quard,currency,valid from,valid until,status',
                'Anjum Makkah,Makkah,5,220,190,175,USD,2026-01-01,2026-12-31,active',
                'Al Safa Seasonal,Makkah,5,210,185,170,USD,2026-09-01,2026-12-31,active',
                ',Madinah,4,150,135,120,USD,2026-09-01,2026-12-31,active',
                'Hotel Salah Kota,Jeddah,4,150,135,120,USD,2026-09-01,2026-12-31,active',
            ])
        );

        $response = $this->post('/api/v1/hotels/import-preview', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_rows', 4)
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.skipped', 1);

        $this->assertCount(1, $response->json('data.errors'));
        $this->assertSame('update', $response->json('data.preview_rows.0.action'));
        $this->assertSame('create', $response->json('data.preview_rows.1.action'));
        $this->assertSame('skip', $response->json('data.preview_rows.2.action'));
        $this->assertSame('error', $response->json('data.preview_rows.3.action'));
    }
}
