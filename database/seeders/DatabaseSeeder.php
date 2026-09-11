<?php

namespace Database\Seeders;

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\AnggotaPeriode;
use App\Models\Kegiatan;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1 & 2. Seed Super Admin dan Pembina beserta Team dan Periode utama
        $this->call(SuperAdminDanPembinaSeeder::class);

        $team = Team::where('name', 'HMIF')->firstOrFail();
        $periode = Periode::where('team_id', $team->id)->where('is_aktif', true)->first()
            ?? Periode::where('team_id', $team->id)->latest()->firstOrFail();

        // 3. Pengurus
        $pengurus = User::firstOrNew(['email' => 'pengurus@hmif.com']);
        $pengurus->forceFill([
            'name' => 'Salira Restu Gusti',
            'nim' => $pengurus->nim ?? '240414018',
            'password' => $pengurus->password ?? Hash::make('password'),
            'role' => GlobalRole::Pengurus,
            'current_team_id' => $team->id,
            'current_periode_id' => $periode->id,
            'email_verified_at' => $pengurus->email_verified_at ?? now(),
        ])->save();

        $team->memberships()->firstOrCreate(
            ['user_id' => $pengurus->id],
            ['role' => TeamRole::Admin]
        );

        // 4. Anggota
        $anggota = User::firstOrNew(['email' => 'anggota@hmif.com']);
        $anggota->forceFill([
            'name' => 'Anggota 1',
            'nim' => $anggota->nim ?? '240414019',
            'password' => $anggota->password ?? Hash::make('password'),
            'role' => GlobalRole::Anggota,
            'current_team_id' => $team->id,
            'current_periode_id' => $periode->id,
            'email_verified_at' => $anggota->email_verified_at ?? now(),
        ])->save();

        $team->memberships()->firstOrCreate(
            ['user_id' => $anggota->id],
            ['role' => TeamRole::Member]
        );

        // 5. Daftarkan pengurus & anggota ke anggota_periode
        AnggotaPeriode::firstOrCreate(
            [
                'user_id' => $pengurus->id,
                'periode_id' => $periode->id,
            ],
            [
                'jabatan' => 'Ketua Umum',
                'status' => 'aktif',
            ]
        );

        AnggotaPeriode::firstOrCreate(
            [
                'user_id' => $anggota->id,
                'periode_id' => $periode->id,
            ],
            [
                'jabatan' => 'Anggota',
                'status' => 'aktif',
            ]
        );

        // Backfill kegiatan existing yang belum memiliki periode_id
        Kegiatan::whereNull('periode_id')->update(['periode_id' => $periode->id]);

        // Seed Visi & Misi awal
        $this->call(VisiMisiSeeder::class);
    }
}
