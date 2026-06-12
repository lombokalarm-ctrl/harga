<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageSnapshotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'label' => $this->label,
            'notes' => $this->notes,
            'is_manual' => (bool) $this->is_manual,
            'generated_jamaah' => $this->generated_jamaah,
            'generated_margin_percent' => $this->generated_margin_percent !== null ? (float) $this->generated_margin_percent : null,
            'generated_target_profit_total' => $this->generated_target_profit_total !== null ? (float) $this->generated_target_profit_total : null,
            'total_cost' => (float) $this->total_cost,
            'hpp_per_jamaah' => (float) $this->hpp_per_jamaah,
            'harga_jual_per_jamaah' => $this->harga_jual_per_jamaah !== null ? (float) $this->harga_jual_per_jamaah : null,
            'profit_total' => $this->profit_total !== null ? (float) $this->profit_total : null,
            'payload_json' => $this->payload_json,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
