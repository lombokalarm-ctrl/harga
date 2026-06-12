<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PackageSnapshotUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
