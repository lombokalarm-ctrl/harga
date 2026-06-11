<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umrah_packages', function (Blueprint $table) {
            $table->date('tanggal_berangkat')->nullable()->after('nama_paket');
        });

        $packages = DB::table('umrah_packages')->select('id', 'visa_id')->get();

        foreach ($packages as $package) {
            $visaValidFrom = DB::table('visas')->where('id', $package->visa_id)->value('valid_from');

            DB::table('umrah_packages')
                ->where('id', $package->id)
                ->update([
                    'tanggal_berangkat' => $visaValidFrom ?: now()->toDateString(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('umrah_packages', function (Blueprint $table) {
            $table->dropColumn('tanggal_berangkat');
        });
    }
};
