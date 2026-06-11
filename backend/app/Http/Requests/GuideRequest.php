<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GuideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'jabatan' => ['nullable', 'string', 'max:100'],
            'jenis' => ['required', 'in:muthawwif,tour_leader,ustadz'],
            'fee' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'in:IDR,USD,SAR'],
            'maksimal_jamaah' => ['required', 'integer', 'min:1'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'status' => ['required', 'in:active,inactive'],
            'import_source_file' => ['nullable', 'string', 'max:255'],
        ];
    }
}
