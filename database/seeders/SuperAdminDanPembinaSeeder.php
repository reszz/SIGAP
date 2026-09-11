<?php

namespace Database\Seeders;

use App\Actions\Teams\CreateTeam;
use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminDanPembinaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Super Admin
        $superAdmin = User::firstOrNew(['email' => 'superadmin@hmif.com']);
        $superAdmin->forceFill([
            'name' => 'Super Administrator',
            'nim' => $superAdmin->nim ?? '000000001',
            'password' => $superAdmin->password ?? Hash::make('password'),
            'role' => GlobalRole::SuperAdmin,
            'email_verified_at' => $superAdmin->email_verified_at ?? now(),
        ])->save();

        // 2. Team HMIF
        $team = Team::where('name', 'HMIF')->first();
        if (! $team) {
            $createTeam = app(CreateTeam::class);
            $team = $createTeam->handle($superAdmin, 'HMIF', isPersonal: false);
        }

        if ($superAdmin->current_team_id !== $team->id) {
            $superAdmin->forceFill(['current_team_id' => $team->id])->save();
        }

        // 3. Pembina
        $pembina = User::firstOrNew(['email' => 'pembina@hmif.com']);
        $pembina->forceFill([
            'name' => 'Pembina HMIF',
            'nim' => $pembina->nim ?? '000000002',
            'password' => $pembina->password ?? Hash::make('password'),
            'role' => GlobalRole::Pembina,
            'current_team_id' => $team->id,
            'email_verified_at' => $pembina->email_verified_at ?? now(),
        ])->save();

        // Pastikan membership Pembina di Team HMIF
        $team->memberships()->firstOrCreate(
            ['user_id' => $pembina->id],
            ['role' => TeamRole::Admin]
        );

        // 4. Default Periode (jika belum ada)
        $periode = Periode::where('team_id', $team->id)->where('is_aktif', true)->first()
            ?? Periode::where('team_id', $team->id)->latest()->first();

        if (! $periode) {
            $periode = Periode::create([
                'team_id' => $team->id,
                'nama' => '2026/2027',
                'tanggal_mulai' => '2026-01-01',
                'tanggal_selesai' => '2026-12-31',
                'is_aktif' => true,
                'created_by' => $superAdmin->id,
            ]);
        }

        if (! $superAdmin->current_periode_id) {
            $superAdmin->forceFill(['current_periode_id' => $periode->id])->save();
        }

        if (! $pembina->current_periode_id) {
            $pembina->forceFill(['current_periode_id' => $periode->id])->save();
        }

        $this->command?->info('Super Admin dan Pembina berhasil di-seed:');
        $this->command?->info('- Super Admin : superadmin@hmif.com (NIM: 000000001, Pass: password)');
        $this->command?->info('- Pembina     : pembina@hmif.com (NIM: 000000002, Pass: password)');
    }
}
