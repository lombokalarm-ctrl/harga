<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItineraryDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'umrah_package_id',
        'hari_ke',
        'judul',
        'deskripsi',
    ];

    protected function casts(): array
    {
        return [
            'hari_ke' => 'integer',
        ];
    }
}
