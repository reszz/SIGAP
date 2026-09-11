<?php

namespace Database\Factories;

use App\Models\Periode;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Periode>
 */
class PeriodeFactory extends Factory
{
    protected $model = Periode::class;

    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'nama' => '2026/2027',
            'tanggal_mulai' => now()->startOfYear()->toDateString(),
            'tanggal_selesai' => now()->endOfYear()->toDateString(),
            'is_aktif' => true,
            'created_by' => User::factory(),
        ];
    }
}
