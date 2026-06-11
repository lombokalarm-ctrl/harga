<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('umrah_packages', function (Blueprint $table) {
            $table->id();
            $table->string('nama_paket');
            $table->unsignedInteger('durasi_hari');
            $table->unsignedInteger('target_jamaah');
            $table->foreignId('hotel_makkah_id')->constrained('hotels');
            $table->foreignId('hotel_madinah_id')->constrained('hotels');
            $table->foreignId('airline_id')->constrained('airlines');
            $table->foreignId('visa_id')->constrained('visas');
            $table->string('status', 20)->default('draft')->index();
            $table->decimal('default_margin_percent', 8, 2)->nullable();
            $table->decimal('target_profit_total', 18, 2)->nullable();
            $table->unsignedInteger('makkah_nights')->default(4);
            $table->unsignedInteger('madinah_nights')->default(4);
            $table->unsignedInteger('room_occupancy')->default(4);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('package_transports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->foreignId('transport_id')->constrained('transports')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('package_guides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->foreignId('guide_id')->constrained('guides')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('package_cost_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->foreignId('cost_component_id')->constrained('cost_components')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('itinerary_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->unsignedInteger('hari_ke');
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        Schema::create('agent_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('agents')->cascadeOnDelete();
            $table->decimal('fee_per_jamaah', 18, 2)->default(0);
            $table->decimal('persentase', 8, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('package_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umrah_package_id')->constrained('umrah_packages')->cascadeOnDelete();
            $table->foreignId('exchange_rate_id')->nullable()->constrained('exchange_rates')->nullOnDelete();
            $table->json('payload_json');
            $table->decimal('total_cost', 18, 2);
            $table->decimal('hpp_per_jamaah', 18, 2);
            $table->decimal('harga_jual_per_jamaah', 18, 2)->nullable();
            $table->decimal('profit_total', 18, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('package_snapshots');
        Schema::dropIfExists('agent_commissions');
        Schema::dropIfExists('itinerary_days');
        Schema::dropIfExists('package_cost_components');
        Schema::dropIfExists('package_guides');
        Schema::dropIfExists('package_transports');
        Schema::dropIfExists('umrah_packages');
    }
};
