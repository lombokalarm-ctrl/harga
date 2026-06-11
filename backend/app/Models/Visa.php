<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Visa extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_visa',
        'harga',
        'mata_uang',
        'masa_berlaku',
        'valid_from',
        'valid_until',
        'status',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'harga' => 'decimal:2',
            'masa_berlaku' => 'integer',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }
}
