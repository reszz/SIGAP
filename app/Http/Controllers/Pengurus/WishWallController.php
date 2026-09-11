<?php

namespace App\Http\Controllers\Pengurus;

use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Models\Wish;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WishWallController extends Controller
{
    /**
     * Tampilkan panel moderasi Wish Wall untuk Pengurus.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $status = $request->query('status', 'semua');
        $search = $request->query('search');

        $query = Wish::query()
            ->when($status === 'tampil', fn ($q) => $q->where('status', 'tampil'))
            ->when($status === 'disembunyikan', fn ($q) => $q->where('status', 'disembunyikan'))
            ->when($status === 'dilaporkan', fn ($q) => $q->where('jumlah_laporan', '>', 0))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nama_pengirim', 'like', "%{$search}%")
                        ->orWhere('pesan', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id');

        $wishes = $query->paginate(15)->withQueryString();

        $stats = [
            'total' => Wish::count(),
            'tampil' => Wish::where('status', 'tampil')->count(),
            'disembunyikan' => Wish::where('status', 'disembunyikan')->count(),
            'dilaporkan' => Wish::where('jumlah_laporan', '>', 0)->count(),
        ];

        $user = $request->user();
        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());
        $canManage = ! $isReadOnly && ($user->isSuperAdmin() || $user->isPengurus());

        return Inertia::render('pengurus/wish-wall/index', [
            'wishes' => $wishes,
            'filters' => [
                'status' => $status,
                'search' => $search ?? '',
            ],
            'stats' => $stats,
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
        ]);
    }

    /**
     * Beralih status antara tampil dan disembunyikan (Moderate).
     */
    public function toggleStatus(Request $request, string $currentTeam, Wish $wish): RedirectResponse
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $newStatus = $wish->status === 'tampil' ? 'disembunyikan' : 'tampil';

        $wish->update([
            'status' => $newStatus,
            // Jika dipulihkan menjadi tampil oleh pengurus, reset counter laporan
            'jumlah_laporan' => $newStatus === 'tampil' ? 0 : $wish->jumlah_laporan,
        ]);

        $message = $newStatus === 'tampil'
            ? 'Pesan berhasil dipulihkan dan kembali tampil di publik.'
            : 'Pesan berhasil disembunyikan dari publik.';

        return back()->with('success', $message);
    }

    /**
     * Hapus pesan secara permanen dari sistem.
     */
    public function destroy(Request $request, string $currentTeam, Wish $wish): RedirectResponse
    {
        $this->checkEditable($request);
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $wish->delete();

        return back()->with('success', 'Pesan berhasil dihapus permanen.');
    }

    /**
     * Pastikan user berhak memoderasi dan periode aktif.
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
