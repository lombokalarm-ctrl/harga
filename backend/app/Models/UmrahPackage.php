<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UmrahPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'nama_paket',
        'tanggal_berangkat',
        'durasi_hari',
        'target_jamaah',
        'hotel_makkah_id',
        'hotel_madinah_id',
        'airline_id',
        'visa_id',
        'status',
        'default_margin_percent',
        'target_profit_total',
        'makkah_nights',
        'madinah_nights',
        'room_occupancy',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'tanggal_berangkat' => 'date:Y-m-d',
        'default_margin_percent' => 'decimal:2',
        'target_profit_total' => 'decimal:2',
        'durasi_hari' => 'integer',
        'target_jamaah' => 'integer',
        'makkah_nights' => 'integer',
        'madinah_nights' => 'integer',
        'room_occupancy' => 'integer',
    ];

    public function hotelMakkah()
    {
        return $this->belongsTo(Hotel::class, 'hotel_makkah_id');
    }

    public function hotelMadinah()
    {
        return $this->belongsTo(Hotel::class, 'hotel_madinah_id');
    }

    public function airline()
    {
        return $this->belongsTo(Airline::class);
    }

    public function visa()
    {
        return $this->belongsTo(Visa::class);
    }

    public function transports()
    {
        return $this->belongsToMany(Transport::class, 'package_transports');
    }

    public function guides()
    {
        return $this->belongsToMany(Guide::class, 'package_guides');
    }

    public function costComponents()
    {
        return $this->belongsToMany(CostComponent::class, 'package_cost_components');
    }

    public function itineraryDays()
    {
        return $this->hasMany(ItineraryDay::class)->orderBy('hari_ke');
    }

    public function agentCommissions()
    {
        return $this->hasMany(AgentCommission::class);
    }

    public function snapshots()
    {
        return $this->hasMany(PackageSnapshot::class)->latest();
    }
}
