<?php

namespace App\Http\Controllers;

use App\Models\Evaluasi;
use App\Models\Presensi;
use App\Models\Rsvp;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatSayaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $team = $user->currentTeam;

        abort_if(! $team, 403, 'User tidak terdaftar di Team mana pun.');

        $teamId = $team->id;

        $riwayatRsvp = Rsvp::with(['kegiatan:id,nama'])
            ->where('user_id', $user->id)
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $teamId)->withoutTrashed())
            ->orderByDesc('waktu_daftar')
            ->limit(50)
            ->get()
            ->map(fn (Rsvp $r) => [
                'id' => $r->id,
                'kegiatanNama' => $r->kegiatan->nama,
                'kegiatanId' => $r->kegiatan->id,
                'status' => $r->status,
                'waktuDaftar' => $r->waktu_daftar?->toIso8601String(),
            ]);

        $riwayatPresensi = Presensi::with(['sesi:id,kegiatan_id,tanggal', 'sesi.kegiatan:id,nama'])
            ->where('user_id', $user->id)
            ->whereHas('sesi.kegiatan', fn ($q) => $q->where('team_id', $teamId)->withoutTrashed())
            ->orderByDesc('waktu_isi')
            ->limit(50)
            ->get()
            ->map(fn (Presensi $p) => [
                'id' => $p->id,
                'kegiatanNama' => $p->sesi->kegiatan->nama,
                'sesiTanggal' => $p->sesi->tanggal?->format('Y-m-d'),
                'waktuIsi' => $p->waktu_isi?->toIso8601String(),
            ]);

        $riwayatEvaluasi = Evaluasi::with(['kegiatan:id,nama'])
            ->where('user_id', $user->id)
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $teamId)->withoutTrashed())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (Evaluasi $e) => [
                'id' => $e->id,
                'kegiatanNama' => $e->kegiatan->nama,
                'kegiatanId' => $e->kegiatan->id,
                'rating' => $e->rating,
                'komentar' => $e->komentar,
                'tanggal' => $e->created_at?->toIso8601String(),
            ]);

        return Inertia::render('riwayat-saya/index', [
            'riwayatRsvp' => $riwayatRsvp,
            'riwayatPresensi' => $riwayatPresensi,
            'riwayatEvaluasi' => $riwayatEvaluasi,
        ]);
    }
}
