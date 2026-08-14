<?php

namespace Database\Factories;

use App\Models\DivisiPanitia;
use App\Models\TugasPanitia;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TugasPanitia>
 */
class TugasPanitiaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'divisi_id' => DivisiPanitia::factory(),
            'user_id' => User::factory(),
            'deskripsi_tugas' => fake()->sentence(5),
            'status' => 'belum',
        ];
    }
}
