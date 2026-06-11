<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HotelImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,csv,pdf', 'max:10240'],
        ];
    }
}
