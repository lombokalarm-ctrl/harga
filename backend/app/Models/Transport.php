<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transport extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_layanan',
        'kategori',
        'harga',
        'mata_uang',
        'valid_from',
        'valid_until',
        'status',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }
}
