<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class PackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_paket' => ['required', 'string', 'max:180'],
            'tanggal_berangkat' => ['required', 'date'],
            'durasi_hari' => ['required', 'integer', 'min:1'],
            'target_jamaah' => ['required', 'integer', 'min:1'],
            'hotel_makkah_id' => ['required', 'exists:hotels,id'],
            'hotel_madinah_id' => ['required', 'exists:hotels,id'],
            'airline_id' => ['required', 'exists:airlines,id'],
            'visa_id' => ['required', 'exists:visas,id'],
            'status' => ['required', 'in:draft,published,archived'],
            'default_margin_percent' => ['nullable', 'numeric', 'min:0'],
            'target_profit_total' => ['nullable', 'numeric', 'min:0'],
            'makkah_nights' => ['required', 'integer', 'min:1'],
            'madinah_nights' => ['required', 'integer', 'min:1'],
            'room_occupancy' => ['required', 'integer', 'min:1'],
            'transport_ids' => ['nullable', 'array'],
            'transport_ids.*' => ['integer', 'exists:transports,id'],
            'guide_ids' => ['nullable', 'array'],
            'guide_ids.*' => ['integer', 'exists:guides,id'],
            'cost_component_ids' => ['nullable', 'array'],
            'cost_component_ids.*' => ['integer', 'exists:cost_components,id'],
            'itinerary_days' => ['nullable', 'array'],
            'itinerary_days.*.hari_ke' => ['required', 'integer', 'min:1'],
            'itinerary_days.*.judul' => ['required', 'string', 'max:150'],
            'itinerary_days.*.deskripsi' => ['nullable', 'string'],
            'agent_commissions' => ['nullable', 'array'],
            'agent_commissions.*.agent_id' => ['required', 'integer', 'exists:agents,id'],
            'agent_commissions.*.fee_per_jamaah' => ['required', 'numeric', 'min:0'],
            'agent_commissions.*.persentase' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $departureDate = $this->input('tanggal_berangkat');
            $tripEndDate = $this->tripEndDate();

            if (! $departureDate || ! $tripEndDate) {
                return;
            }

            $this->validateSeasonalMaster($validator, 'hotel_makkah_id', 'hotels', 'Hotel Makkah', $departureDate, $tripEndDate);
            $this->validateSeasonalMaster($validator, 'hotel_madinah_id', 'hotels', 'Hotel Madinah', $departureDate, $tripEndDate);
            $this->validateSeasonalMaster($validator, 'airline_id', 'airlines', 'Maskapai', $departureDate, $tripEndDate);
            $this->validateSeasonalMaster($validator, 'visa_id', 'visas', 'Visa', $departureDate, $tripEndDate);
            $this->validateSeasonalMaster($validator, 'transport_ids', 'transports', 'Transportasi', $departureDate, $tripEndDate, true);
            $this->validateSeasonalMaster($validator, 'guide_ids', 'guides', 'Pembimbing', $departureDate, $tripEndDate, true);
            $this->validateSeasonalMaster($validator, 'cost_component_ids', 'cost_components', 'Komponen biaya', $departureDate, $tripEndDate, true);
        });
    }

    private function validateSeasonalMaster(
        Validator $validator,
        string $field,
        string $table,
        string $label,
        string $departureDate,
        string $tripEndDate,
        bool $multiple = false
    ): void {
        $value = $this->input($field);

        if ($value === null || $value === '' || $value === []) {
            return;
        }

        $ids = $multiple ? array_values(array_filter((array) $value)) : [(int) $value];

        if ($ids === []) {
            return;
        }

        $records = DB::table($table)
            ->whereIn('id', $ids)
            ->get(['id', 'status', 'valid_from', 'valid_until'])
            ->keyBy('id');

        foreach ($ids as $id) {
            $record = $records->get((int) $id);

            if (! $record) {
                continue;
            }

            $isActive = $record->status === 'active';
            $isWithinRange = $record->valid_from <= $departureDate && $record->valid_until >= $tripEndDate;

            if ($isActive && $isWithinRange) {
                continue;
            }

            $validator->errors()->add(
                $field,
                sprintf(
                    '%s yang dipilih harus aktif dan berlaku untuk seluruh perjalanan %s s/d %s.',
                    $label,
                    $departureDate,
                    $tripEndDate
                )
            );

            return;
        }
    }

    private function tripEndDate(): ?string
    {
        $departureDate = $this->input('tanggal_berangkat');
        $duration = (int) $this->input('durasi_hari');

        if (! $departureDate || $duration < 1) {
            return null;
        }

        return Carbon::parse($departureDate)->addDays($duration - 1)->toDateString();
    }
}
