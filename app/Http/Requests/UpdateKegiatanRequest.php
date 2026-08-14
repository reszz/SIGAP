<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateKegiatanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama' => 'required|string|max:150',
            'deskripsi' => 'nullable|string',
            'tipe' => 'required|in:wajib_hadir,terbuka',
            'kuota' => 'nullable|integer|min:1|required_if:tipe,terbuka',
            'warna' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ];
    }
}
