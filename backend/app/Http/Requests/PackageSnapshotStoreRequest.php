<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageSnapshotStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'jamaah' => ['nullable', 'integer', 'min:1'],
            'margin_percent' => ['nullable', 'numeric', 'min:0'],
            'target_profit_total' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
