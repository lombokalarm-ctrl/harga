<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Airline;
use App\Models\CostComponent;
use App\Models\ExchangeRate;
use App\Models\Guide;
use App\Models\Hotel;
use App\Models\Transport;
use App\Models\UmrahPackage;
use App\Models\User;
use App\Models\Visa;
use App\Services\PackageService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::query()->updateOrCreate(
            ['email' => 'admin@umrah.test'],
            ['name' => 'Super Admin', 'password' => Hash::make('password'), 'role' => 'super_admin', 'is_active' => true]
        );

        User::query()->updateOrCreate(
            ['email' => 'finance@umrah.test'],
            ['name' => 'Finance User', 'password' => Hash::make('password'), 'role' => 'finance', 'is_active' => true]
        );
        User::query()->updateOrCreate(
            ['email' => 'marketing@umrah.test'],
            ['name' => 'Marketing User', 'password' => Hash::make('password'), 'role' => 'marketing', 'is_active' => true]
        );
        User::query()->updateOrCreate(
            ['email' => 'director@umrah.test'],
            ['name' => 'Director User', 'password' => Hash::make('password'), 'role' => 'director', 'is_active' => true]
        );

        $makkah = Hotel::query()->create([
            'nama_hotel' => 'Anjum Makkah',
            'kota' => 'Makkah',
            'kategori_bintang' => 5,
            'alamat' => 'Ibrahim Al Khalil Road',
            'jarak_ke_masjid' => 300,
            'harga_double' => 180,
            'harga_triple' => 155,
            'harga_quad' => 140,
            'mata_uang' => 'USD',
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $madinah = Hotel::query()->create([
            'nama_hotel' => 'Saja Al Madinah',
            'kota' => 'Madinah',
            'kategori_bintang' => 4,
            'alamat' => 'King Faisal Street',
            'jarak_ke_masjid' => 350,
            'harga_double' => 145,
            'harga_triple' => 125,
            'harga_quad' => 110,
            'mata_uang' => 'USD',
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $airline = Airline::query()->create([
            'nama_maskapai' => 'Saudia',
            'kode_maskapai' => 'SV',
            'rute' => 'CGK-JED-MED-CGK',
            'harga_tiket' => 980,
            'mata_uang' => 'USD',
            'bagasi' => '30 kg',
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $visa = Visa::query()->create([
            'nama_visa' => 'Visa Umrah Reguler',
            'harga' => 200,
            'mata_uang' => 'USD',
            'masa_berlaku' => 30,
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $transport = Transport::query()->create([
            'nama_layanan' => 'Bus Full Trip',
            'kategori' => 'bus',
            'harga' => 12000,
            'mata_uang' => 'SAR',
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $guide = Guide::query()->create([
            'nama' => 'Ustadz Ahmad',
            'jabatan' => 'Pembimbing Ibadah',
            'jenis' => 'ustadz',
            'fee' => 12500000,
            'mata_uang' => 'IDR',
            'maksimal_jamaah' => 45,
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $perJamaah = CostComponent::query()->create([
            'nama' => 'Asuransi',
            'kategori' => 'per_jamaah',
            'harga' => 150000,
            'mata_uang' => 'IDR',
            'is_default' => true,
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $perGroup = CostComponent::query()->create([
            'nama' => 'Dokumentasi',
            'kategori' => 'per_grup',
            'harga' => 5000000,
            'mata_uang' => 'IDR',
            'is_default' => true,
            'valid_from' => now()->startOfYear()->toDateString(),
            'valid_until' => now()->endOfYear()->toDateString(),
            'status' => 'active',
            'import_source_file' => 'seed-data',
        ]);

        $agent = Agent::query()->create([
            'nama_agen' => 'Agen Mitra Utama',
            'fee_per_jamaah' => 150000,
            'persentase' => 1.5,
            'status' => 'active',
        ]);

        ExchangeRate::query()->create([
            'usd_to_idr' => 16350,
            'sar_to_idr' => 4350,
            'effective_at' => now(),
            'is_active' => true,
            'created_by' => $superAdmin->id,
        ]);

        $package = UmrahPackage::query()->create([
            'nama_paket' => 'Umrah Platinum 12 Hari',
            'tanggal_berangkat' => now()->toDateString(),
            'durasi_hari' => 12,
            'target_jamaah' => 45,
            'hotel_makkah_id' => $makkah->id,
            'hotel_madinah_id' => $madinah->id,
            'airline_id' => $airline->id,
            'visa_id' => $visa->id,
            'status' => 'draft',
            'default_margin_percent' => 15,
            'target_profit_total' => 75000000,
            'makkah_nights' => 5,
            'madinah_nights' => 5,
            'room_occupancy' => 4,
            'created_by' => $superAdmin->id,
            'updated_by' => $superAdmin->id,
        ]);

        $package->transports()->sync([$transport->id]);
        $package->guides()->sync([$guide->id]);
        $package->costComponents()->sync([$perJamaah->id, $perGroup->id]);
        $package->itineraryDays()->createMany([
            ['hari_ke' => 1, 'judul' => 'Keberangkatan', 'deskripsi' => 'Briefing dan penerbangan menuju Jeddah.'],
            ['hari_ke' => 2, 'judul' => 'Masuk Makkah', 'deskripsi' => 'Check-in hotel dan pelaksanaan umrah pertama.'],
            ['hari_ke' => 3, 'judul' => 'Ibadah dan Ziarah', 'deskripsi' => 'Program ibadah dan pendampingan pembimbing.'],
        ]);
        $package->agentCommissions()->create([
            'agent_id' => $agent->id,
            'fee_per_jamaah' => 150000,
            'persentase' => 1.5,
        ]);

        app(PackageService::class)->storeSnapshot($package);
    }
}
