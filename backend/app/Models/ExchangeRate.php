<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExchangeRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'usd_to_idr',
        'sar_to_idr',
        'effective_at',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'usd_to_idr' => 'decimal:4',
            'sar_to_idr' => 'decimal:4',
            'effective_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
