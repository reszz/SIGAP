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
use Inertia\Inertia;
use Inertia\Response;

class KegiatanController extends Controller
{
    private const PALET_WARNA = [
        '#5B4FE9',
        '#FF6F59',
        '#FFC857',
        '#2EC4B6',
        '#F45B8D',
        '#4FB6E9',
        '#9BD94B',
        '#A855C9',
        '#F2994A',
        '#1B8A8A',
    ];

    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        return Inertia::render('kegiatan/index', [
            'kegiatan' => Kegiatan::where('team_id', $team->id)
                ->withCount('sesi')
                ->latest()
                ->get(),
        ]);
    }

    public function create(Request $request, string $currentTeam): Response
    {
        return Inertia::render('kegiatan/create');
    }

    public function store(StoreKegiatanRequest $request, string $currentTeam): RedirectResponse
    {
        $validated = $request->validated();
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        DB::transaction(function () use ($validated, $team) {
            $kegiatan = Kegiatan::create([
                'team_id' => $team->id,
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
        return Inertia::render('kegiatan/edit', [
            'kegiatan' => $kegiatan->load('sesi.rundown'),
        ]);
    }

    public function update(UpdateKegiatanRequest $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
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
            'divisiPanitia.tugasPanitia.user',
        ]);

        // Request dari kalender / EventDetailCard
        if ($request->expectsJson()) {
            return response()->json($kegiatan);
        }

        return $this->detail($request, $currentTeam, $kegiatan);
    }

    public function detail(Request $request, string $currentTeam, Kegiatan $kegiatan): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        abort_if($kegiatan->team_id !== $team->id, 403);

        return Inertia::render('kegiatan/show', [
            'kegiatan' => $kegiatan->load([
                'sesi.rundown',
                'divisiPanitia.tugasPanitia.user' => fn ($q) => $q->withTrashed(),
                'rsvp.user',
                'anggaran',
                'dokumentasi.uploadedBy',
                'evaluasi.user',
            ]),
            'canManage' => $request->user()->role === 'pengurus',
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
