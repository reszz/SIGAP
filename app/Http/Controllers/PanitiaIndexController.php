<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use App\Services\KegiatanAuthService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PanitiaIndexController extends Controller
{
    /**
     * GET /{team}/panitia?kegiatan_id=
     *
     * Di shared group — bisa diakses Ketua Pelaksana (anggota) maupun Pengurus.
     * Hanya Kegiatan yang user punya akses kepanitiaan.manage yang muncul.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->with([
                'kepanitiaan.user',
                'tugas.pic',
            ])
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna', 'team_id']);

        // Tampilkan kegiatan yang user bisa akses (kepanitiaan.manage ATAU punya jabatan divisi)
        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => Gate::forUser($user)->allows('kepanitiaan.manage', $k)
                || ! empty(KegiatanAuthService::jabatanDiAll($user, $k->id))
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        // Flags otorisasi untuk kegiatan yang dipilih
        $canManageKepanitiaan = $selectedKegiatan
            && Gate::forUser($user)->allows('kepanitiaan.manage', $selectedKegiatan);

        // Jabatan user di kegiatan yang dipilih (untuk batasi aksi tugas)
        $jabatanUser = $selectedKegiatanId
            ? array_map(fn ($j) => $j->value, KegiatanAuthService::jabatanDiAll($user, $selectedKegiatanId))
            : [];

        // Anggota team untuk dropdown assign
        $anggotaTeam = $team->members()
            ->get(['users.id', 'users.name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            ->values();

        $kepanitiaan = $selectedKegiatan?->kepanitiaan->map(fn ($k) => [
            'id' => $k->id,
            'jabatan' => $k->jabatan->value ?? $k->jabatan,
            'user_id' => $k->user_id,
            'user' => $k->user ? ['id' => $k->user->id, 'name' => $k->user->name] : null,
        ])->values() ?? collect();

        $tugas = $selectedKegiatan?->tugas->map(fn ($t) => [
            'id' => $t->id,
            'jabatan' => $t->jabatan->value ?? $t->jabatan,
            'deskripsi_tugas' => $t->deskripsi_tugas,
            'status' => $t->status->value ?? $t->status,
            'prioritas' => $t->prioritas->value ?? $t->prioritas,
            'deadline' => $t->deadline?->format('Y-m-d'),
            'pic_user_id' => $t->pic_user_id,
            'pic' => $t->pic ? ['id' => $t->pic->id, 'name' => $t->pic->name] : null,
        ])->values() ?? collect();

        return Inertia::render('pengurus/panitia/index', [
            'kegiatanList' => $kegiatanList->map(fn ($k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'warna' => $k->warna,
            ]),
            'selectedKegiatanId' => $selectedKegiatanId,
            'kepanitiaan' => $kepanitiaan,
            'tugas' => $tugas,
            'anggotaTeam' => $anggotaTeam,
            'canManageKepanitiaan' => $canManageKepanitiaan,
            'jabatanUser' => $jabatanUser,
        ]);
    }
}
