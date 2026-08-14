<?php

namespace App\Http\Controllers;

use App\Models\Presensi;
use App\Models\Rsvp;
use App\Models\Sesi;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PresensiController extends Controller
{
    /**
     * GET /{current_team}/pengurus/sesi/{sesi}/presensi
     * Rekap presensi per sesi untuk Pengurus.
     */
    public function index(Request $request, string $currentTeam, Sesi $sesi): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $sesi->load(['kegiatan', 'presensi.user']);

        abort_if($sesi->kegiatan->team_id !== $team->id, 403);

        // Semua member team yang seharusnya hadir
        $anggotaTeam = $team->members()->orderBy('name')->get(['users.id', 'users.name', 'users.nim']);

        // Yang sudah hadir
        $sudahHadir = $sesi->presensi->map(fn ($p) => [
            'user_id' => $p->user_id,
            'name' => $p->user?->name ?? '[Anggota dihapus]',
            'nim' => $p->user?->nim ?? '-',
            'waktu_isi' => $p->waktu_isi?->toTimeString() ?? '-',
            'catatan' => $p->catatan,
        ]);

        $sudahHadirIds = $sudahHadir->pluck('user_id')->toArray();

        // Yang belum hadir
        $belumHadir = $anggotaTeam
            ->filter(fn ($u) => ! in_array($u->id, $sudahHadirIds))
            ->map(fn ($u) => ['user_id' => $u->id, 'name' => $u->name, 'nim' => $u->nim]);

        return Inertia::render('presensi/rekap', [
            'sesi' => [
                'id' => $sesi->id,
                'tanggal' => $sesi->tanggal->toDateString(),
                'waktu_mulai' => $sesi->waktu_mulai,
                'waktu_selesai' => $sesi->waktu_selesai,
                'lokasi' => $sesi->lokasi,
                'status' => $sesi->status,
                'kode_presensi' => $sesi->kode_presensi,
            ],
            'kegiatan' => [
                'id' => $sesi->kegiatan->id,
                'nama' => $sesi->kegiatan->nama,
                'warna' => $sesi->kegiatan->warna,
            ],
            'sudahHadir' => $sudahHadir->values(),
            'belumHadir' => $belumHadir->values(),
            'totalAnggota' => $anggotaTeam->count(),
        ]);
    }

    /**
     * GET /{current_team}/presensi/{kode}
     * Form presensi — redirect ke login jika belum login.
     * Validasi RSVP jika tipe = terbuka.
     */
    public function show(Request $request, string $currentTeam, string $kode): Response|RedirectResponse
    {
        $sesi = Sesi::with('kegiatan')
            ->where('kode_presensi', $kode)
            ->firstOrFail();

        $kegiatan = $sesi->kegiatan;
        $user = $request->user();

        // Cek tipe kegiatan — jika terbuka, validasi RSVP
        if ($kegiatan->tipe === 'terbuka') {
            $rsvp = Rsvp::where('kegiatan_id', $kegiatan->id)
                ->where('user_id', $user->id)
                ->where('status', 'terdaftar')
                ->first();

            if (! $rsvp) {
                return Inertia::render('presensi/ditolak', [
                    'kegiatan' => $kegiatan,
                    'alasan' => 'Kamu belum terdaftar (RSVP) di kegiatan ini.',
                ]);
            }
        }

        // Cek apakah sudah pernah presensi di sesi ini
        $sudahPresensi = Presensi::where('sesi_id', $sesi->id)
            ->where('user_id', $user->id)
            ->exists();

        return Inertia::render('presensi/form', [
            'sesi' => [
                'id' => $sesi->id,
                'tanggal' => $sesi->tanggal->toDateString(),
                'waktu_mulai' => $sesi->waktu_mulai,
                'waktu_selesai' => $sesi->waktu_selesai,
                'lokasi' => $sesi->lokasi,
                'status' => $sesi->status,
                'kode_presensi' => $sesi->kode_presensi,
            ],
            'kegiatan' => [
                'id' => $kegiatan->id,
                'nama' => $kegiatan->nama,
                'tipe' => $kegiatan->tipe,
                'warna' => $kegiatan->warna,
            ],
            'user' => [
                'name' => $user->name,
                'nim' => $user->nim,
                'email' => $user->email,
            ],
            'sudahPresensi' => $sudahPresensi,
        ]);
    }

    /**
     * POST /{current_team}/presensi/{kode}
     * Submit presensi — ikuti validasi di sequence diagram secara berurutan.
     */
    public function store(Request $request, string $currentTeam, string $kode): RedirectResponse
    {
        $sesi = Sesi::with('kegiatan')
            ->where('kode_presensi', $kode)
            ->firstOrFail();

        $kegiatan = $sesi->kegiatan;
        $user = $request->user();

        $validated = $request->validate([
            'catatan' => 'nullable|string|max:500',
        ]);

        // Validasi 1: jika terbuka, cek RSVP
        if ($kegiatan->tipe === 'terbuka') {
            $rsvp = Rsvp::where('kegiatan_id', $kegiatan->id)
                ->where('user_id', $user->id)
                ->where('status', 'terdaftar')
                ->first();

            if (! $rsvp) {
                return redirect()->back()->withErrors(['rsvp' => 'Kamu belum terdaftar di kegiatan ini.']);
            }
        }

        // Validasi 2: cek constraint unique (sesi_id, user_id)
        $sudahPresensi = Presensi::where('sesi_id', $sesi->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($sudahPresensi) {
            return redirect()->back()->withErrors(['presensi' => 'Presensi kamu di sesi ini sudah tercatat.']);
        }

        Presensi::create([
            'sesi_id' => $sesi->id,
            'user_id' => $user->id,
            'catatan' => $validated['catatan'] ?? null,
            'waktu_isi' => now(),
        ]);

        return redirect()->back()->with('success', 'Presensi berhasil dicatat!');
    }
}
