<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExchangeRateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'usd_to_idr' => ['required', 'numeric', 'min:0'],
            'sar_to_idr' => ['required', 'numeric', 'min:0'],
            'effective_at' => ['required', 'date'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
