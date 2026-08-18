<?php

namespace App\Http\Controllers;

use App\Exports\LaporanKegiatanExport;
use App\Models\Kegiatan;
use App\Models\Presensi;
use App\Models\Team;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LaporanController extends Controller
{
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $kegiatan = Kegiatan::where('team_id', $team->id)
            ->withCount('sesi')
            ->with('sesi:id,kegiatan_id,tanggal')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'tipe' => $k->tipe,
                'sesi_count' => $k->sesi_count,
                'tanggal_pertama' => $k->sesi->min('tanggal')?->format('Y-m-d'),
                'tanggal_terakhir' => $k->sesi->max('tanggal')?->format('Y-m-d'),
            ]);

        return Inertia::render('laporan/index', [
            'kegiatanList' => $kegiatan,
            'teamNama' => $team->name,
        ]);
    }

    public function preview(Request $request, string $currentTeam): JsonResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $kegiatan = $this->resolveKegiatan($request, $team);
        $total = $team->members()->count();

        return response()->json($kegiatan->map(fn ($k) => $this->buildPreview($k, $total)));
    }

    public function exportExcel(Request $request, string $currentTeam): BinaryFileResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $kegiatan = $this->resolveKegiatan($request, $team);
        $total = $team->members()->count();

        $data = $kegiatan->map(fn ($k) => $this->buildFullData($k, $total));

        $filename = 'Laporan-'.$team->name.'-'.now()->format('Ymd').'.xlsx';

        return Excel::download(new LaporanKegiatanExport($data, $team), $filename);
    }

    public function exportPdf(Request $request, string $currentTeam): \Illuminate\Http\Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $kegiatan = $this->resolveKegiatan($request, $team);
        $total = $team->members()->count();

        $data = $kegiatan->map(fn ($k) => $this->buildFullData($k, $total));

        $filename = 'Laporan-'.$team->name.'-'.now()->format('Ymd').'.pdf';

        return Pdf::loadView('laporan.kegiatan', [
            'data' => $data,
            'team' => $team,
            'generatedAt' => now()->format('d/m/Y H:i'),
        ])
            ->setPaper('a4', 'portrait')
            ->download($filename);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function resolveKegiatan(Request $request, Team $team): Collection
    {
        $query = Kegiatan::where('team_id', $team->id)
            ->with([
                'sesi.presensi.user',
                'sesi.rundown',
                'rsvp',
                'anggaran',
                'evaluasi',
            ]);

        if ($request->filled('kegiatan_ids')) {
            $query->whereIn('id', $request->input('kegiatan_ids'));
        } elseif ($request->filled('tanggal_mulai') && $request->filled('tanggal_selesai')) {
            $query->whereHas('sesi', fn ($q) => $q
                ->whereDate('tanggal', '>=', $request->input('tanggal_mulai'))
                ->whereDate('tanggal', '<=', $request->input('tanggal_selesai'))
            );
        }

        $list = $query->get();
        abort_if($list->isEmpty(), 422, 'Tidak ada kegiatan yang sesuai filter.');

        return $list;
    }

    private function buildPreview(Kegiatan $k, int $totalAnggota): array
    {
        $hadir = $k->sesi->flatMap(fn ($s) => $s->presensi->pluck('user_id'))->unique()->count();
        $rsvp = $k->rsvp->where('status', 'terdaftar')->count();
        $estimasi = $k->anggaran->sum('estimasi');
        $realisasi = $k->anggaran->sum('realisasi');
        $pct = $totalAnggota > 0 ? round($hadir / $totalAnggota * 100, 1) : 0;
        $rataRating = $k->evaluasi->count() > 0 ? round($k->evaluasi->avg('rating'), 1) : null;

        return [
            'id' => $k->id,
            'nama' => $k->nama,
            'tipe' => $k->tipe,
            'total_sesi' => $k->sesi->count(),
            'peserta_rsvp' => $rsvp,
            'total_hadir' => $hadir,
            'persentase_hadir' => $pct,
            'total_estimasi' => $estimasi,
            'total_realisasi' => $realisasi,
            'selisih_anggaran' => $realisasi - $estimasi,
            'rata_rating' => $rataRating,
            'jumlah_evaluasi' => $k->evaluasi->count(),
        ];
    }

    private function buildFullData(Kegiatan $k, int $totalAnggota): array
    {
        $preview = $this->buildPreview($k, $totalAnggota);

        // Daftar presensi detail
        $presensiDetail = $k->sesi->flatMap(fn ($s) => $s->presensi->map(fn ($p) => [
            'sesi_tanggal' => $s->tanggal?->format('d/m/Y'),
            'nama' => $p->user?->name ?? '-',
            'nim' => $p->user?->nim ?? '-',
            'waktu_isi' => $p->waktu_isi?->format('H:i'),
        ]));

        // Anggaran detail
        $anggaranDetail = $k->anggaran->map(fn ($a) => [
            'jenis' => $a->jenis,
            'sumber_kategori' => $a->sumber_kategori,
            'estimasi' => $a->estimasi,
            'realisasi' => $a->realisasi,
            'selisih' => ($a->realisasi ?? 0) - $a->estimasi,
        ]);

        // Sesi + rundown
        $sesiDetail = $k->sesi->map(fn ($s) => [
            'tanggal' => $s->tanggal?->format('d/m/Y'),
            'waktu_mulai' => $s->waktu_mulai,
            'waktu_selesai' => $s->waktu_selesai,
            'lokasi' => $s->lokasi,
            'rundown' => $s->rundown->sortBy('urutan')->map(fn ($r) => [
                'waktu' => $r->waktu,
                'uraian_acara' => $r->uraian_acara,
            ])->values(),
        ]);

        return array_merge($preview, [
            'sesi_detail' => $sesiDetail,
            'presensi_detail' => $presensiDetail->values(),
            'anggaran_detail' => $anggaranDetail->values(),
        ]);
    }
}
