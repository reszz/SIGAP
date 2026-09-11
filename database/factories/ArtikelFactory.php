<?php

namespace Database\Factories;

use App\Models\Artikel;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Artikel>
 */
class ArtikelFactory extends Factory
{
    protected $model = Artikel::class;

    public function definition(): array
    {
        $judul = fake()->sentence(5);

        return [
            'team_id' => Team::factory(),
            'judul' => $judul,
            'slug' => Artikel::generateUniqueSlug($judul),
            'ringkasan' => fake()->paragraph(2),
            'konten' => fake()->paragraphs(4, true),
            'gambar_sampul' => null,
            'status' => 'draft',
            'ditulis_oleh' => User::factory(),
            'diterbitkan_pada' => null,
        ];
    }

    public function terbit(): static
    {
        return $this->state(fn () => [
            'status' => 'terbit',
            'diterbitkan_pada' => now()->subDay(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn () => [
            'status' => 'draft',
            'diterbitkan_pada' => null,
        ]);
    }
}
