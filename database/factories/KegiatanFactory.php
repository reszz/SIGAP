<?php

namespace Database\Factories;

use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Kegiatan>
 */
class KegiatanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'nama' => fake()->sentence(3),
            'deskripsi' => fake()->paragraph(),
            'tipe' => fake()->randomElement(['wajib_hadir', 'terbuka']),
            'kuota' => null,
            'warna' => '#'.fake()->hexColor(),
        ];
    }

    public function terbuka(): static
    {
        return $this->state(fn () => [
            'tipe' => 'terbuka',
            'kuota' => fake()->numberBetween(10, 100),
        ]);
    }

    public function wajibHadir(): static
    {
        return $this->state(fn () => [
            'tipe' => 'wajib_hadir',
            'kuota' => null,
        ]);
    }
}
