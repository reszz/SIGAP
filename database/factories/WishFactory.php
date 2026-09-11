<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\Wish;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Wish>
 */
class WishFactory extends Factory
{
    protected $model = Wish::class;

    public function definition(): array
    {
        return [
            'team_id' => Team::factory(),
            'nama_pengirim' => fake()->name(),
            'pesan' => fake()->sentence(12),
            'ip_address' => fake()->ipv4(),
            'status' => 'tampil',
            'jumlah_laporan' => 0,
        ];
    }

    public function anonim(): static
    {
        return $this->state(fn () => [
            'nama_pengirim' => null,
        ]);
    }

    public function disembunyikan(): static
    {
        return $this->state(fn () => [
            'status' => 'disembunyikan',
        ]);
    }

    public function dilaporkan(int $count = 1): static
    {
        return $this->state(fn () => [
            'jumlah_laporan' => $count,
        ]);
    }
}
