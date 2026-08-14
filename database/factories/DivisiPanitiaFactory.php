<?php

namespace Database\Factories;

use App\Models\DivisiPanitia;
use App\Models\Kegiatan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DivisiPanitia>
 */
class DivisiPanitiaFactory extends Factory
{
    public function definition(): array
    {
        $namaList = ['Acara', 'Konsumsi', 'Perlengkapan', 'Humas', 'Dokumentasi', 'Keamanan'];

        return [
            'kegiatan_id' => Kegiatan::factory(),
            'nama_divisi' => fake()->randomElement($namaList),
        ];
    }
}
