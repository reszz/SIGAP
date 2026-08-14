<?php

namespace Database\Factories;

use App\Models\Presensi;
use App\Models\Sesi;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Presensi>
 */
class PresensiFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sesi_id' => Sesi::factory(),
            'user_id' => User::factory(),
            'catatan' => null,
            'waktu_isi' => now(),
        ];
    }
}
