<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_agen',
        'fee_per_jamaah',
        'persentase',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'fee_per_jamaah' => 'decimal:2',
            'persentase' => 'decimal:2',
        ];
    }
}
