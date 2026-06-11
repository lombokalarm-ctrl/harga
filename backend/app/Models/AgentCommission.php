<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AgentCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'umrah_package_id',
        'agent_id',
        'fee_per_jamaah',
        'persentase',
    ];

    protected function casts(): array
    {
        return [
            'fee_per_jamaah' => 'decimal:2',
            'persentase' => 'decimal:2',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }
}
