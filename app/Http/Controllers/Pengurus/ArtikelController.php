<?php

namespace App\Http\Controllers\Pengurus;

use App\Http\Controllers\Controller;
use App\Models\Artikel;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ArtikelController extends Controller
{
    /**
     * Tampilkan daftar semua artikel (draft dan terbit).
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $status = $request->query('status');
        $search = $request->query('search');

        $articlesQuery = Artikel::where('team_id', $team->id)
            ->with(['penulis:id,name,nim,email'])
            ->when($status && in_array($status, ['draft', 'terbit']), function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('judul', 'like', "%{$search}%")
                        ->orWhere('ringkasan', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id');

        $articles = $articlesQuery->paginate(10)->withQueryString();

        $stats = [
            'total' => Artikel::where('team_id', $team->id)->count(),
            'terbit' => Artikel::where('team_id', $team->id)->where('status', 'terbit')->count(),
            'draft' => Artikel::where('team_id', $team->id)->where('status', 'draft')->count(),
        ];

        $user = $request->user();
        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());
        $canManage = ! $isReadOnly && ($user->isSuperAdmin() || $user->isPengurus());

        return Inertia::render('pengurus/artikel/index', [
            'articles' => $articles,
            'filters' => [
                'status' => $status ?? 'semua',
                'search' => $search ?? '',
            ],
            'stats' => $stats,
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
        ]);
    }

    /**
     * Form tulis artikel baru.
     */
    public function create(Request $request, string $currentTeam): Response
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        return Inertia::render('pengurus/artikel/form', [
            'artikel' => null,
        ]);
    }

    /**
     * Simpan artikel baru.
     */
    public function store(Request $request, string $currentTeam): RedirectResponse
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $validated = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'ringkasan' => ['required', 'string', 'max:1000'],
            'konten' => ['required', 'string'],
            'status' => ['required', 'in:draft,terbit'],
            'diterbitkan_pada' => ['nullable', 'date'],
            'gambar_sampul' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $gambarPath = null;
        if ($request->hasFile('gambar_sampul')) {
            $gambarPath = $request->file('gambar_sampul')->store('artikel', 'public');
        }

        $slug = Artikel::generateUniqueSlug($validated['judul']);

        $diterbitkanPada = $validated['diterbitkan_pada'] ?? null;
        if ($validated['status'] === 'terbit' && empty($diterbitkanPada)) {
            $diterbitkanPada = now();
        }

        $artikel = $team->artikel()->create([
            'judul' => $validated['judul'],
            'slug' => $slug,
            'ringkasan' => $validated['ringkasan'],
            'konten' => $validated['konten'],
            'gambar_sampul' => $gambarPath,
            'status' => $validated['status'],
            'ditulis_oleh' => $request->user()->id,
            'diterbitkan_pada' => $diterbitkanPada,
        ]);

        return redirect()->route('pengurus.artikel.index', $team->slug)
            ->with('success', 'Artikel berhasil disimpan.');
    }

    /**
     * Form edit artikel.
     */
    public function edit(Request $request, string $currentTeam, Artikel $artikel): Response
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($artikel->team_id !== $team->id, 403);

        return Inertia::render('pengurus/artikel/form', [
            'artikel' => $artikel->load('penulis:id,name'),
        ]);
    }

    /**
     * Update artikel.
     */
    public function update(Request $request, string $currentTeam, Artikel $artikel): RedirectResponse
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($artikel->team_id !== $team->id, 403);

        $validated = $request->validate([
            'judul' => ['required', 'string', 'max:255'],
            'ringkasan' => ['required', 'string', 'max:1000'],
            'konten' => ['required', 'string'],
            'status' => ['required', 'in:draft,terbit'],
            'diterbitkan_pada' => ['nullable', 'date'],
            'gambar_sampul' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $slug = $artikel->slug;
        if ($artikel->judul !== $validated['judul']) {
            $slug = Artikel::generateUniqueSlug($validated['judul'], $artikel->id);
        }

        $gambarPath = $artikel->gambar_sampul;
        if ($request->hasFile('gambar_sampul')) {
            if ($artikel->gambar_sampul && Storage::disk('public')->exists($artikel->gambar_sampul)) {
                Storage::disk('public')->delete($artikel->gambar_sampul);
            }
            $gambarPath = $request->file('gambar_sampul')->store('artikel', 'public');
        }

        $diterbitkanPada = $validated['diterbitkan_pada'] ?? $artikel->diterbitkan_pada;
        if ($validated['status'] === 'terbit' && empty($diterbitkanPada)) {
            $diterbitkanPada = now();
        }

        $artikel->update([
            'judul' => $validated['judul'],
            'slug' => $slug,
            'ringkasan' => $validated['ringkasan'],
            'konten' => $validated['konten'],
            'gambar_sampul' => $gambarPath,
            'status' => $validated['status'],
            'diterbitkan_pada' => $diterbitkanPada,
        ]);

        return redirect()->route('pengurus.artikel.index', $team->slug)
            ->with('success', 'Artikel berhasil diperbarui.');
    }

    /**
     * Hapus artikel.
     */
    public function destroy(Request $request, string $currentTeam, Artikel $artikel): RedirectResponse
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($artikel->team_id !== $team->id, 403);

        if ($artikel->gambar_sampul && Storage::disk('public')->exists($artikel->gambar_sampul)) {
            Storage::disk('public')->delete($artikel->gambar_sampul);
        }

        $artikel->delete();

        return redirect()->route('pengurus.artikel.index', $team->slug)
            ->with('success', 'Artikel berhasil dihapus.');
    }

    /**
     * Pastikan user berhak membuat / mengubah artikel dan periode aktif.
     */
    private function checkEditable(Request $request): void
    {
        $user = $request->user();
        if ($user->isPembina()) {
            abort(403, 'Pembina hanya memiliki akses baca (read-only) untuk modul ini.');
        }

        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        if (! $user->isSuperAdmin() && ! $isPeriodeEditable) {
            abort(403, 'Periode lampau bersifat arsip dan tidak dapat diubah (read-only).');
        }
    }
}
