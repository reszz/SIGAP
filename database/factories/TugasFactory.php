<?php

namespace Database\Factories;

use App\Enums\JabatanTugas;
use App\Enums\PrioritasTugas;
use App\Models\Kegiatan;
use App\Models\Tugas;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tugas>
 */
class TugasFactory extends Factory
{
    protected $model = Tugas::class;

    public function definition(): array
    {
        return [
            'kegiatan_id' => Kegiatan::factory(),
            'jabatan' => fake()->randomElement(JabatanTugas::cases())->value,
            'pic_user_id' => User::factory(),
            'dibuat_oleh' => User::factory(),
            'deskripsi_tugas' => fake()->sentence(6),
            'status' => 'belum',
            'prioritas' => fake()->randomElement(PrioritasTugas::cases())->value,
            'deadline' => fake()->optional()->dateTimeBetween('now', '+2 months')?->format('Y-m-d'),
        ];
    }

    public function belum(): static
    {
        return $this->state(['status' => 'belum']);
    }

    public function sedang(): static
    {
        return $this->state(['status' => 'sedang']);
    }

    public function selesai(): static
    {
        return $this->state(['status' => 'selesai']);
    }

    public function prioritasTinggi(): static
    {
        return $this->state(['prioritas' => PrioritasTugas::Tinggi->value]);
    }
}
