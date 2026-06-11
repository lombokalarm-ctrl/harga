<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HotelImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_can_import_hotel_prices_from_csv(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'finance@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->createWithContent(
            'hotel-prices.csv',
            implode("\n", [
                'hotel,city,star,double,triple,quard,currency,valid from,valid until,distance',
                'Al Safa Seasonal,Makkah,5,210,185,170,USD,2026-09-01,2026-12-31,350',
            ])
        );

        $response = $this->post('/api/v1/hotels/import', [
            'file' => $file,
        ], [
            'Accept' => 'application/json',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.created', 1)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped', 0);

        $hotel = Hotel::query()->where('nama_hotel', 'Al Safa Seasonal')->firstOrFail();
        $this->assertSame('Makkah', $hotel->kota);
        $this->assertSame(210.0, (float) $hotel->harga_double);
        $this->assertSame(185.0, (float) $hotel->harga_triple);
        $this->assertSame(170.0, (float) $hotel->harga_quad);
        $this->assertSame('USD', $hotel->mata_uang);
        $this->assertSame('2026-09-01', $hotel->valid_from->toDateString());
        $this->assertSame('2026-12-31', $hotel->valid_until->toDateString());
        $this->assertSame('hotel-prices.csv', $hotel->import_source_file);
    }
}
