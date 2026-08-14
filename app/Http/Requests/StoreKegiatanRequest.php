<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreKegiatanRequest extends FormRequest
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
            'sesi' => 'required|array|min:1',
            'sesi.*.tanggal' => 'required|date',
            'sesi.*.waktu_mulai' => 'required|date_format:H:i',
            'sesi.*.waktu_selesai' => 'required|date_format:H:i|after:sesi.*.waktu_mulai',
            'sesi.*.lokasi' => 'required|string|max:200',
            'sesi.*.rundown' => 'nullable|array',
            'sesi.*.rundown.*.waktu' => 'required_with:sesi.*.rundown.*|date_format:H:i',
            'sesi.*.rundown.*.uraian_acara' => 'required_with:sesi.*.rundown.*|string|max:255',
        ];
    }
}
