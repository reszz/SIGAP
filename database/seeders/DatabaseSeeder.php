<?php

namespace Database\Seeders;

use App\Actions\Teams\CreateTeam;
use App\Enums\TeamRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $createTeam = app(CreateTeam::class);

        $pengurus = User::create([
            'name' => 'Salira Restu Gusti',
            'nim' => '240414018',
            'email' => 'pengurus@hmif.com',
            'password' => bcrypt('password'),
            'role' => 'pengurus',
        ]);

        // Create the shared SIGAP organization team — this is the single team
        // for the entire organization (single-tenant per SRS §2.6).
        $team = $createTeam->handle($pengurus, 'HMIF', isPersonal: false);

        $anggota = User::create([
            'name' => 'Anggota 1',
            'nim' => '240414019',
            'email' => 'anggota@hmif.com',
            'password' => bcrypt('password'),
            'role' => 'anggota',
        ]);

        $team->memberships()->create([
            'user_id' => $anggota->id,
            'role' => TeamRole::Member,
        ]);

        $anggota->switchTeam($team);
    }
}
