<?php

namespace Database\Factories;

use App\Models\Kegiatan;
use App\Models\Rsvp;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rsvp>
 */
class RsvpFactory extends Factory
{
    public function definition(): array
    {
        return [
            'kegiatan_id' => Kegiatan::factory()->terbuka(),
            'user_id' => User::factory(),
            'status' => 'terdaftar',
            'waktu_daftar' => now(),
        ];
    }

    public function dibatalkan(): static
    {
        return $this->state(fn () => ['status' => 'dibatalkan']);
    }
}
