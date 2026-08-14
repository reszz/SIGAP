<?php

namespace Database\Factories;

use App\Models\Kegiatan;
use App\Models\Sesi;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sesi>
 */
class SesiFactory extends Factory
{
    public function definition(): array
    {
        $tanggal = fake()->dateTimeBetween('-1 month', '+1 month');

        return [
            'kegiatan_id' => Kegiatan::factory(),
            'tanggal' => $tanggal->format('Y-m-d'),
            'waktu_mulai' => '08:00:00',
            'waktu_selesai' => '10:00:00',
            'lokasi' => fake()->address(),
            'kode_presensi' => Str::random(24),
        ];
    }
}
