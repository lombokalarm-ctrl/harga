<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageSimulationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'jamaah' => ['nullable', 'integer', 'min:1'],
            'margin_percent' => ['nullable', 'numeric', 'min:0'],
            'target_profit_total' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
