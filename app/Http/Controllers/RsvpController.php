<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Rsvp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RsvpController extends Controller
{
    /**
     * POST /{current_team}/kegiatan/{kegiatan}/rsvp
     * Anggota mendaftar RSVP — instant, langsung terdaftar selama kuota tersedia.
     * Wajib pakai DB transaction + lock row untuk cegah race condition.
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): JsonResponse
    {
        abort_if($kegiatan->tipe !== 'terbuka', 422, 'Kegiatan ini tidak memerlukan RSVP.');

        $user = $request->user();

        try {
            $result = DB::transaction(function () use ($kegiatan, $user) {
                // Lock row kegiatan untuk cegah race condition
                $kegiatan = Kegiatan::lockForUpdate()->findOrFail($kegiatan->id);

                // Cek apakah Anggota sudah punya baris RSVP (terdaftar atau dibatalkan)
                $rsvp = Rsvp::where('kegiatan_id', $kegiatan->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($rsvp && $rsvp->status === 'terdaftar') {
                    return ['error' => 'Kamu sudah terdaftar di kegiatan ini.', 'code' => 409];
                }

                // Hitung sisa kuota (hanya status terdaftar yang dihitung)
                $terdaftar = Rsvp::where('kegiatan_id', $kegiatan->id)
                    ->where('status', 'terdaftar')
                    ->count();

                if ($terdaftar >= $kegiatan->kuota) {
                    return ['error' => 'Kuota sudah penuh.', 'code' => 422];
                }

                if ($rsvp) {
                    // Update baris lama yang statusnya dibatalkan
                    $rsvp->update(['status' => 'terdaftar', 'waktu_daftar' => now()]);
                } else {
                    // Insert baris baru
                    $rsvp = Rsvp::create([
                        'kegiatan_id' => $kegiatan->id,
                        'user_id' => $user->id,
                        'status' => 'terdaftar',
                        'waktu_daftar' => now(),
                    ]);
                }

                $sisaKuota = $kegiatan->kuota - ($terdaftar + 1);

                return ['rsvp' => $rsvp, 'sisa_kuota' => $sisaKuota];
            });

            if (isset($result['error'])) {
                return response()->json(['message' => $result['error']], $result['code']);
            }

            return response()->json([
                'message' => 'RSVP berhasil. Kamu sekarang terdaftar.',
                'status' => 'terdaftar',
                'sisa_kuota' => $result['sisa_kuota'],
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan, coba lagi.'], 500);
        }
    }

    /**
     * DELETE /{current_team}/kegiatan/{kegiatan}/rsvp
     * Anggota membatalkan RSVP — update status ke dibatalkan.
     */
    public function destroy(Request $request, string $currentTeam, Kegiatan $kegiatan): JsonResponse
    {
        $user = $request->user();

        $rsvp = Rsvp::where('kegiatan_id', $kegiatan->id)
            ->where('user_id', $user->id)
            ->where('status', 'terdaftar')
            ->first();

        if (! $rsvp) {
            return response()->json(['message' => 'Kamu tidak memiliki RSVP aktif untuk kegiatan ini.'], 404);
        }

        $rsvp->update(['status' => 'dibatalkan']);

        // Hitung sisa kuota setelah pembatalan
        $terdaftar = Rsvp::where('kegiatan_id', $kegiatan->id)
            ->where('status', 'terdaftar')
            ->count();

        return response()->json([
            'message' => 'RSVP dibatalkan.',
            'status' => 'dibatalkan',
            'sisa_kuota' => $kegiatan->kuota - $terdaftar,
        ]);
    }

    /**
     * GET /{current_team}/kegiatan/{kegiatan}/rsvp
     * Pengurus melihat daftar peserta yang RSVP — read-only, tanpa aksi setuju/tolak.
     */
    public function index(Request $request, string $currentTeam, Kegiatan $kegiatan): JsonResponse
    {
        $peserta = Rsvp::with('user:id,name,nim,email')
            ->where('kegiatan_id', $kegiatan->id)
            ->where('status', 'terdaftar')
            ->orderBy('waktu_daftar')
            ->get()
            ->map(fn (Rsvp $r) => [
                'id' => $r->id,
                'user' => $r->user,
                'waktu_daftar' => $r->waktu_daftar,
            ]);

        $terdaftar = $peserta->count();

        return response()->json([
            'peserta' => $peserta,
            'terdaftar' => $terdaftar,
            'kuota' => $kegiatan->kuota,
            'sisa_kuota' => $kegiatan->kuota - $terdaftar,
        ]);
    }

    /**
     * GET /{current_team}/kegiatan/{kegiatan}/rsvp/status
     * Anggota cek status RSVP miliknya untuk kegiatan ini (dipakai Event Detail Card).
     */
    public function status(Request $request, string $currentTeam, Kegiatan $kegiatan): JsonResponse
    {
        $user = $request->user();

        $rsvp = Rsvp::where('kegiatan_id', $kegiatan->id)
            ->where('user_id', $user->id)
            ->first();

        $terdaftar = Rsvp::where('kegiatan_id', $kegiatan->id)
            ->where('status', 'terdaftar')
            ->count();

        return response()->json([
            'status' => $rsvp?->status ?? null,
            'sisa_kuota' => $kegiatan->kuota ? $kegiatan->kuota - $terdaftar : null,
        ]);
    }
}
