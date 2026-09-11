<?php

namespace Database\Factories;

use App\Models\AnggotaPeriode;
use App\Models\Periode;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AnggotaPeriode>
 */
class AnggotaPeriodeFactory extends Factory
{
    protected $model = AnggotaPeriode::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'periode_id' => Periode::factory(),
            'divisi_organisasi_id' => null,
            'jabatan' => 'Anggota',
            'status' => 'aktif',
        ];
    }
}
