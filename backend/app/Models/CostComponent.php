<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CostComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'kategori',
        'harga',
        'mata_uang',
        'is_default',
        'valid_from',
        'valid_until',
        'status',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'is_default' => 'boolean',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }
}
