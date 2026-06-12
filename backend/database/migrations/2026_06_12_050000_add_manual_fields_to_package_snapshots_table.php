<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('package_snapshots', function (Blueprint $table) {
            $table->string('label')->nullable()->after('exchange_rate_id');
            $table->text('notes')->nullable()->after('label');
            $table->boolean('is_manual')->default(false)->after('notes');
            $table->unsignedInteger('generated_jamaah')->nullable()->after('is_manual');
            $table->decimal('generated_margin_percent', 8, 2)->nullable()->after('generated_jamaah');
            $table->decimal('generated_target_profit_total', 18, 2)->nullable()->after('generated_margin_percent');
            $table->foreignId('created_by')->nullable()->after('generated_target_profit_total')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('package_snapshots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn([
                'label',
                'notes',
                'is_manual',
                'generated_jamaah',
                'generated_margin_percent',
                'generated_target_profit_total',
            ]);
        });
    }
};
