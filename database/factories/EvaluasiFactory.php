<?php

namespace Database\Factories;

use App\Models\Evaluasi;
use App\Models\Kegiatan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evaluasi>
 */
class EvaluasiFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kegiatan_id' => Kegiatan::factory(),
            'user_id' => User::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'komentar' => fake()->optional()->paragraph(),
        ];
    }
}
