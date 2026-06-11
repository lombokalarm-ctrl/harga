<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VisaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_visa' => ['required', 'string', 'max:120'],
            'harga' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'in:IDR,USD,SAR'],
            'masa_berlaku' => ['required', 'integer', 'min:1'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'status' => ['required', 'in:active,inactive'],
            'import_source_file' => ['nullable', 'string', 'max:255'],
        ];
    }
}
