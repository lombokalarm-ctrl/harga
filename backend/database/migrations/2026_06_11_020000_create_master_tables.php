<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('nama_hotel');
            $table->string('kota')->index();
            $table->unsignedTinyInteger('kategori_bintang')->index();
            $table->text('alamat')->nullable();
            $table->unsignedInteger('jarak_ke_masjid')->nullable();
            $table->decimal('harga_double', 18, 2);
            $table->decimal('harga_triple', 18, 2);
            $table->decimal('harga_quad', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('foto_url')->nullable();
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('airlines', function (Blueprint $table) {
            $table->id();
            $table->string('nama_maskapai');
            $table->string('kode_maskapai', 10);
            $table->string('rute')->nullable();
            $table->decimal('harga_tiket', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->string('bagasi')->nullable();
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('logo_url')->nullable();
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('visas', function (Blueprint $table) {
            $table->id();
            $table->string('nama_visa');
            $table->decimal('harga', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->unsignedInteger('masa_berlaku');
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('transports', function (Blueprint $table) {
            $table->id();
            $table->string('nama_layanan');
            $table->string('kategori', 50);
            $table->decimal('harga', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('guides', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('jabatan')->nullable();
            $table->string('jenis', 50);
            $table->decimal('fee', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->unsignedInteger('maksimal_jamaah');
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('cost_components', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->string('kategori', 20);
            $table->decimal('harga', 18, 2);
            $table->string('mata_uang', 3)->default('IDR');
            $table->boolean('is_default')->default(false);
            $table->date('valid_from');
            $table->date('valid_until');
            $table->string('status', 20)->default('active');
            $table->string('import_source_file')->nullable();
            $table->timestamps();
        });

        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->string('nama_agen');
            $table->decimal('fee_per_jamaah', 18, 2)->default(0);
            $table->decimal('persentase', 8, 2)->default(0);
            $table->string('status', 20)->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agents');
        Schema::dropIfExists('cost_components');
        Schema::dropIfExists('guides');
        Schema::dropIfExists('transports');
        Schema::dropIfExists('visas');
        Schema::dropIfExists('airlines');
        Schema::dropIfExists('hotels');
    }
};
