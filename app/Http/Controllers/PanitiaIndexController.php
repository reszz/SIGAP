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

        $periodeId = $user->current_periode_id;

        $kegiatanQuery = Kegiatan::where('team_id', $team->id);
        if ($periodeId) {
            $kegiatanQuery->where(function ($q) use ($periodeId) {
                $q->where('periode_id', $periodeId)
                    ->orWhereNull('periode_id');
            });
        }

        $semuaKegiatan = $kegiatanQuery
            ->with([
                'kepanitiaan.user',
                'tugas.pic',
            ])
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna', 'team_id']);

        // Tampilkan kegiatan yang user bisa akses:
        // Super Admin & Pembina dapat melihat semua kegiatan (Pembina sebagai read-only)
        // Pengurus / Panitia melihat kegiatan yang mereka pimpin atau memiliki jabatan divisi
        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => $user->isSuperAdmin()
                || $user->isPembina()
                || Gate::forUser($user)->allows('kepanitiaan.manage', $k)
                || ! empty(KegiatanAuthService::jabatanDiAll($user, $k->id))
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());

        // Flags otorisasi untuk kegiatan yang dipilih (Pembina & periode arsip adalah strictly read-only)
        $canManageKepanitiaan = ! $isReadOnly
            && $selectedKegiatan
            && Gate::forUser($user)->allows('kepanitiaan.manage', $selectedKegiatan);

        // Jabatan user di kegiatan yang dipilih (untuk batasi aksi tugas)
        $jabatanUser = ($selectedKegiatanId && ! $isReadOnly)
            ? array_map(fn ($j) => $j->value, KegiatanAuthService::jabatanDiAll($user, $selectedKegiatanId))
            : [];

        // Anggota team untuk dropdown assign
        $anggotaTeam = $team->members()
            ->get(['users.id', 'users.name'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name])
            ->values();

        // Divisi yang dikoordinatori oleh user yang sedang login
        $koordinatorDivisi = ($selectedKegiatanId && ! $isReadOnly)
            ? KegiatanAuthService::divisiKoordinatorUser($user, $selectedKegiatanId)
            : [];

        $kepanitiaan = $selectedKegiatan?->kepanitiaan->map(fn ($k) => [
            'id' => $k->id,
            'jabatan' => $k->jabatan->value ?? $k->jabatan,
            'user_id' => $k->user_id,
            'is_koordinator' => (bool) $k->is_koordinator,
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
            'koordinatorDivisi' => $koordinatorDivisi,
            'isReadOnly' => $isReadOnly,
        ]);
    }
}
