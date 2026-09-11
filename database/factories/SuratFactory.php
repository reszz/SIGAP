<?php

namespace Database\Factories;

use App\Models\Kegiatan;
use App\Models\Surat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Surat>
 */
class SuratFactory extends Factory
{
    protected $model = Surat::class;

    public function definition(): array
    {
        $tipe = fake()->randomElement(['masuk', 'keluar']);

        return [
            'kegiatan_id' => Kegiatan::factory(),
            'tipe' => $tipe,
            'nomor_surat' => fake()->numerify('###/ORG/###/####'),
            'jenis_surat' => fake()->randomElement([
                'Undangan', 'Permohonan', 'Pemberitahuan', 'Balasan', 'Rekomendasi',
            ]),
            'perihal' => fake()->sentence(5),
            'tanggal_surat' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'pengirim_penerima' => $tipe === 'masuk' ? fake()->company() : fake()->name(),
            'file_path' => fake()->optional(0.5)->passthrough(
                'surat/1/1/contoh_'.fake()->word().'.pdf'
            ),
            'keterangan' => fake()->optional(0.6)->sentence(8),
            'dibuat_oleh' => User::factory(),
        ];
    }

    public function masuk(): static
    {
        return $this->state(['tipe' => 'masuk']);
    }

    public function keluar(): static
    {
        return $this->state(['tipe' => 'keluar']);
    }

    public function tanpaFile(): static
    {
        return $this->state(['file_path' => null]);
    }
}
