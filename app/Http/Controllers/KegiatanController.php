<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKegiatanRequest;
use App\Http\Requests\UpdateKegiatanRequest;
use App\Models\Evaluasi;
use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class KegiatanController extends Controller
{
    private const PALET_WARNA = [
        '#4F46E5',
        '#10B981',
        '#F59E0B',
        '#0EA5E9',
        '#8B5CF6',
        '#EC4899',
        '#14B8A6',
        '#F97316',
        '#06B6D4',
        '#6366F1',
    ];

    public function index(Request $request, string $currentTeam): Response
    {
        $user = $request->user();
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $periodeId = $user->current_periode_id;

        $kegiatanQuery = Kegiatan::where('team_id', $team->id);
        if ($periodeId) {
            $kegiatanQuery->where('periode_id', $periodeId);
        }

        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());
        $canManage = ! $isReadOnly && Gate::allows('create', Kegiatan::class);

        return Inertia::render('kegiatan/index', [
            'kegiatan' => $kegiatanQuery
                ->withCount(['sesi', 'kepanitiaan'])
                ->with('sesi:id,kegiatan_id,tanggal,waktu_mulai,waktu_selesai')
                ->latest()
                ->get()
                ->map(fn (Kegiatan $k) => [
                    'id' => $k->id,
                    'nama' => $k->nama,
                    'deskripsi' => $k->deskripsi,
                    'tipe' => $k->tipe,
                    'kuota' => $k->kuota,
                    'warna' => $k->warna,
                    'sesi_count' => $k->sesi_count,
                    'kepanitiaan_count' => $k->kepanitiaan_count,
                    'status_agregat' => $this->statusAgregat($k->sesi),
                    'created_at' => $k->created_at?->toDateString(),
                ]),
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
        ]);
    }

    public function create(Request $request, string $currentTeam): Response
    {
        Gate::authorize('create', Kegiatan::class);

        return Inertia::render('kegiatan/create');
    }

    public function store(StoreKegiatanRequest $request, string $currentTeam): RedirectResponse
    {
        $validated = $request->validated();
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $periodeId = $request->user()->current_periode_id ?? $team->periodes()->where('is_aktif', true)->value('id');

        DB::transaction(function () use ($validated, $team, $periodeId) {
            $kegiatan = Kegiatan::create([
                'team_id' => $team->id,
                'periode_id' => $periodeId,
                'nama' => $validated['nama'],
                'deskripsi' => $validated['deskripsi'] ?? null,
                'tipe' => $validated['tipe'],
                'kuota' => $validated['tipe'] === 'terbuka' ? $validated['kuota'] : null,
                'warna' => self::PALET_WARNA[Kegiatan::count() % count(self::PALET_WARNA)],
            ]);

            foreach ($validated['sesi'] as $sesiData) {
                $sesi = $kegiatan->sesi()->create([
                    'tanggal' => $sesiData['tanggal'],
                    'waktu_mulai' => $sesiData['waktu_mulai'],
                    'waktu_selesai' => $sesiData['waktu_selesai'],
                    'lokasi' => $sesiData['lokasi'],
                ]);

                foreach ($sesiData['rundown'] ?? [] as $i => $rundownItem) {
                    $sesi->rundown()->create([
                        'waktu' => $rundownItem['waktu'],
                        'uraian_acara' => $rundownItem['uraian_acara'],
                        'urutan' => $i + 1,
                    ]);
                }
            }
        });

        return redirect()
            ->route('pengurus.kegiatan.index', ['current_team' => $currentTeam])
            ->with('success', 'Kegiatan berhasil dibuat.');
    }

    public function edit(Request $request, string $currentTeam, Kegiatan $kegiatan): Response
    {
        $this->authorize('update', $kegiatan);

        $user = $request->user();
        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        if (! $user->isSuperAdmin() && ! $isPeriodeEditable) {
            abort(403, 'Periode lampau bersifat arsip dan tidak dapat diubah (read-only).');
        }

        return Inertia::render('kegiatan/edit', [
            'kegiatan' => $kegiatan->load('sesi.rundown'),
        ]);
    }

    public function update(UpdateKegiatanRequest $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $this->authorize('update', $kegiatan);

        $validated = $request->validated();

        $kegiatan->update([
            'nama' => $validated['nama'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'tipe' => $validated['tipe'],
            'kuota' => $validated['tipe'] === 'terbuka' ? $validated['kuota'] : null,
            'warna' => $validated['warna'] ?? $kegiatan->warna,
        ]);

        return redirect()
            ->route('pengurus.kegiatan.index', ['current_team' => $currentTeam])
            ->with('success', 'Kegiatan berhasil diperbarui.');
    }

    public function destroy(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $this->authorize('delete', $kegiatan);

        $kegiatan->delete();

        return redirect()
            ->back()
            ->with('success', 'Kegiatan berhasil dihapus.');
    }

    /**
     * GET /{current_team}/kegiatan/{kegiatan}
     * Event Detail Card Ã¢â‚¬â€ JSON, dipanggil fetch() dari React.
     * Role: Anggota + Pengurus
     */
    public function show(Request $request, string $currentTeam, Kegiatan $kegiatan): JsonResponse|Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        abort_if($kegiatan->team_id !== $team->id, 403);

        $kegiatan->load([
            'sesi.rundown',
            'kepanitiaan.user',
            'tugas.pic',
            'rsvp.user',
            'anggaran',
            'dokumentasi.uploadedBy',
            'evaluasi.user',
            'surat',
        ]);

        $kegiatan->setRelation('evaluasi', $kegiatan->evaluasi
            ->map(function ($evaluasiItem) {
                $user = $evaluasiItem->user?->toArray() ?? ['id' => 0, 'name' => 'Anonim'];

                return array_merge($evaluasiItem->toArray(), [
                    'user' => [
                        'id' => $user['id'] ?? 0,
                        'name' => 'Anonim',
                    ],
                ]);
            })
            ->values());

        // Request dari kalender / EventDetailCard
        if ($request->expectsJson()) {
            $user = $request->user();

            return response()->json(array_merge(
                $kegiatan->toArray(),
                ['canManageAnggaran' => Gate::forUser($user)->allows('anggaran.manage', $kegiatan)],
            ));
        }

        return $this->detail($request, $currentTeam, $kegiatan);
    }

    /** Hitung status agregat Kegiatan dari seluruh Sesi-nya. */
    private function statusAgregat(mixed $sesi): string
    {
        if ($sesi->isEmpty()) {
            return 'belum_ada_sesi';
        }
        $statuses = $sesi->map(fn ($s) => $s->status)->unique()->values()->toArray();
        if (in_array('berlangsung', $statuses)) {
            return 'berlangsung';
        }
        if (count($statuses) === 1 && $statuses[0] === 'selesai') {
            return 'selesai';
        }

        return 'terjadwal';
    }

    public function detail(Request $request, string $currentTeam, Kegiatan $kegiatan): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        abort_if($kegiatan->team_id !== $team->id, 403);

        $user = $request->user();
        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());

        $kegiatanWithEvaluasiAnonim = $kegiatan->load([
            'sesi.rundown',
            'kepanitiaan.user',
            'tugas.pic',
            'rsvp.user',
            'anggaran',
            'dokumentasi.uploadedBy',
            'evaluasi.user',
            'surat',
        ]);

        $kegiatanWithEvaluasiAnonim->setRelation('evaluasi', $kegiatanWithEvaluasiAnonim->evaluasi
            ->map(function ($evaluasiItem) {
                $user = $evaluasiItem->user?->toArray() ?? ['id' => 0, 'name' => 'Anonim'];

                return array_merge($evaluasiItem->toArray(), [
                    'user' => [
                        'id' => $user['id'] ?? 0,
                        'name' => 'Anonim',
                    ],
                ]);
            })
            ->values());

        return Inertia::render('kegiatan/show', [
            'kegiatan' => $kegiatanWithEvaluasiAnonim,
            'canManage' => ! $isReadOnly && $user->can('manage', $kegiatan),
            'isReadOnly' => $isReadOnly,
            'anggotaTeam' => $team->members()
                ->get()
                ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
            'authUserId' => $request->user()->id,
            'evaluasiSaya' => Evaluasi::where('kegiatan_id', $kegiatan->id)
                ->where('user_id', $request->user()->id)
                ->first(['id', 'rating', 'komentar']),
            'kegiatanSelesai' => $kegiatan->sesi->count() > 0
                && $kegiatan->sesi->every(fn ($s) => $s->status === 'selesai'),
        ]);
    }
}
