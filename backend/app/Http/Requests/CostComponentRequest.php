<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CostComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:150'],
            'kategori' => ['required', 'in:per_jamaah,per_grup'],
            'harga' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'in:IDR,USD,SAR'],
            'is_default' => ['nullable', 'boolean'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'status' => ['required', 'in:active,inactive'],
            'import_source_file' => ['nullable', 'string', 'max:255'],
        ];
    }
}
