<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_paket' => $this->nama_paket,
            'tanggal_berangkat' => optional($this->tanggal_berangkat)->format('Y-m-d'),
            'durasi_hari' => $this->durasi_hari,
            'target_jamaah' => $this->target_jamaah,
            'status' => $this->status,
            'default_margin_percent' => $this->default_margin_percent,
            'target_profit_total' => $this->target_profit_total,
            'makkah_nights' => $this->makkah_nights,
            'madinah_nights' => $this->madinah_nights,
            'room_occupancy' => $this->room_occupancy,
            'hotel_makkah' => new EntityResource($this->whenLoaded('hotelMakkah')),
            'hotel_madinah' => new EntityResource($this->whenLoaded('hotelMadinah')),
            'airline' => new EntityResource($this->whenLoaded('airline')),
            'visa' => new EntityResource($this->whenLoaded('visa')),
            'transports' => EntityResource::collection($this->whenLoaded('transports')),
            'guides' => EntityResource::collection($this->whenLoaded('guides')),
            'cost_components' => EntityResource::collection($this->whenLoaded('costComponents')),
            'itinerary_days' => EntityResource::collection($this->whenLoaded('itineraryDays')),
            'agent_commissions' => EntityResource::collection($this->whenLoaded('agentCommissions')),
            'latest_snapshot' => $this->snapshots->first()?->payload_json,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
