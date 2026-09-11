<?php

namespace Database\Factories;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Kepanitiaan>
 */
class KepanitiaanFactory extends Factory
{
    protected $model = Kepanitiaan::class;

    public function definition(): array
    {
        return [
            'kegiatan_id' => Kegiatan::factory(),
            'user_id' => User::factory(),
            'jabatan' => fake()->randomElement(JabatanKepanitiaan::cases())->value,
            'is_koordinator' => false,
        ];
    }

    /**
     * State untuk koordinator divisi.
     */
    public function koordinator(): static
    {
        return $this->state(['is_koordinator' => true]);
    }

    /**
     * State untuk jabatan ketua_pelaksana.
     */
    public function ketuaPelaksana(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::KetuaPelaksana->value]);
    }

    /**
     * State untuk jabatan bendahara.
     */
    public function bendahara(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::Bendahara->value]);
    }

    /**
     * State untuk jabatan sekretaris.
     */
    public function sekretaris(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::Sekretaris->value]);
    }

    /**
     * State untuk jabatan divisi acara.
     */
    public function divAcara(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::DivAcara->value]);
    }

    /**
     * State untuk jabatan divisi humas.
     */
    public function divHumas(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::DivHumas->value]);
    }

    /**
     * State untuk jabatan divisi PDD.
     */
    public function divPdd(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::DivPdd->value]);
    }

    /**
     * State untuk jabatan divisi logistik.
     */
    public function divLogistik(): static
    {
        return $this->state(['jabatan' => JabatanKepanitiaan::DivLogistik->value]);
    }
}
