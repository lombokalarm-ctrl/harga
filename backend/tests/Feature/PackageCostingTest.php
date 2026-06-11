<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PackageCostingTest extends TestCase
{
    use RefreshDatabase;

    public function test_costing_endpoint_returns_summary_payload(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'marketing@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/packages/1/costing');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'total_hotel',
                    'total_tiket',
                    'total_visa',
                    'total_cost',
                    'hpp_per_jamaah',
                    'harga_jual_per_jamaah',
                    'profit_total',
                    'break_even_jamaah',
                ],
            ]);
    }

    public function test_package_detail_includes_departure_date(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'marketing@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/packages/1');

        $response
            ->assertOk()
            ->assertJsonPath('data.tanggal_berangkat', now()->toDateString());
    }

    public function test_package_update_rejects_masters_outside_trip_period(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'marketing@umrah.test')->firstOrFail();
        Sanctum::actingAs($user);

        $response = $this->putJson('/api/v1/packages/1', [
            'nama_paket' => 'Umrah Platinum 12 Hari',
            'tanggal_berangkat' => now()->endOfYear()->subDays(6)->toDateString(),
            'durasi_hari' => 12,
            'target_jamaah' => 45,
            'hotel_makkah_id' => 1,
            'hotel_madinah_id' => 2,
            'airline_id' => 1,
            'visa_id' => 1,
            'status' => 'draft',
            'default_margin_percent' => 15,
            'target_profit_total' => 75000000,
            'makkah_nights' => 5,
            'madinah_nights' => 5,
            'room_occupancy' => 4,
            'transport_ids' => [1],
            'guide_ids' => [1],
            'cost_component_ids' => [1, 2],
            'itinerary_days' => [
                ['hari_ke' => 1, 'judul' => 'Keberangkatan', 'deskripsi' => 'Briefing dan penerbangan menuju Jeddah.'],
            ],
            'agent_commissions' => [
                ['agent_id' => 1, 'fee_per_jamaah' => 150000, 'persentase' => 1.5],
            ],
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'hotel_makkah_id',
                'hotel_madinah_id',
                'airline_id',
                'visa_id',
                'transport_ids',
                'guide_ids',
                'cost_component_ids',
            ]);
    }
}
