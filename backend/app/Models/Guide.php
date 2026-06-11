<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guide extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama',
        'jabatan',
        'jenis',
        'fee',
        'mata_uang',
        'maksimal_jamaah',
        'valid_from',
        'valid_until',
        'status',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'fee' => 'decimal:2',
            'maksimal_jamaah' => 'integer',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }
}
