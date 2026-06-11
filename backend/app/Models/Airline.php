<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Airline extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_maskapai',
        'kode_maskapai',
        'rute',
        'harga_tiket',
        'mata_uang',
        'bagasi',
        'valid_from',
        'valid_until',
        'status',
        'logo_url',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'harga_tiket' => 'decimal:2',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }
}
