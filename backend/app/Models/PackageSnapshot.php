<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PackageSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'umrah_package_id',
        'exchange_rate_id',
        'payload_json',
        'total_cost',
        'hpp_per_jamaah',
        'harga_jual_per_jamaah',
        'profit_total',
    ];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'total_cost' => 'decimal:2',
            'hpp_per_jamaah' => 'decimal:2',
            'harga_jual_per_jamaah' => 'decimal:2',
            'profit_total' => 'decimal:2',
        ];
    }
}
