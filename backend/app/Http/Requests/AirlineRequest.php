<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AirlineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_maskapai' => ['required', 'string', 'max:150'],
            'kode_maskapai' => ['required', 'string', 'max:10'],
            'rute' => ['nullable', 'string', 'max:255'],
            'harga_tiket' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'in:IDR,USD,SAR'],
            'bagasi' => ['nullable', 'string', 'max:100'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'status' => ['required', 'in:active,inactive'],
            'logo_url' => ['nullable', 'url'],
            'import_source_file' => ['nullable', 'string', 'max:255'],
        ];
    }
}
