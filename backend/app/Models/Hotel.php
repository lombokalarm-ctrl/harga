<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hotel extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_hotel',
        'kota',
        'kategori_bintang',
        'alamat',
        'jarak_ke_masjid',
        'harga_double',
        'harga_triple',
        'harga_quad',
        'mata_uang',
        'valid_from',
        'valid_until',
        'status',
        'foto_url',
        'import_source_file',
    ];

    protected function casts(): array
    {
        return [
            'kategori_bintang' => 'integer',
            'jarak_ke_masjid' => 'integer',
            'harga_double' => 'decimal:2',
            'harga_triple' => 'decimal:2',
            'harga_quad' => 'decimal:2',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }

    public function resolveRateByOccupancy(int $occupancy): float
    {
        return match ($occupancy) {
            2 => (float) $this->harga_double,
            3 => (float) $this->harga_triple,
            default => (float) $this->harga_quad,
        };
    }
}
