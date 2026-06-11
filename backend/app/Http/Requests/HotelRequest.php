<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class HotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_hotel' => ['required', 'string', 'max:150'],
            'kota' => ['required', 'string', 'max:80'],
            'kategori_bintang' => ['required', 'integer', 'between:1,5'],
            'alamat' => ['nullable', 'string'],
            'jarak_ke_masjid' => ['nullable', 'integer', 'min:0'],
            'harga_double' => ['required', 'numeric', 'min:0'],
            'harga_triple' => ['required', 'numeric', 'min:0'],
            'harga_quad' => ['required', 'numeric', 'min:0'],
            'mata_uang' => ['required', 'in:IDR,USD,SAR'],
            'valid_from' => ['required', 'date'],
            'valid_until' => ['required', 'date', 'after_or_equal:valid_from'],
            'status' => ['required', 'in:active,inactive'],
            'foto_url' => ['nullable', 'url'],
        ];
    }
}
