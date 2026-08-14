<?php

namespace App\Http\Controllers;

use App\Models\Dokumentasi;
use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Support\Facades\Storage;

class DokumentasiController extends Controller
{
    /**
     * POST /{team}/pengurus/kegiatan/{kegiatan}/dokumentasi
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'tipe' => 'required|in:foto,notulen',
            'file' => [
                'required',
                'file',
                function ($attribute, $value, $fail) use ($request) {
                    $tipe = $request->input('tipe');
                    $ext = strtolower($value->getClientOriginalExtension());

                    if ($tipe === 'foto') {
                        if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
                            $fail('File foto harus berformat jpg, jpeg, png, webp, atau gif.');
                        }
                        if ($value->getSize() > 5 * 1024 * 1024) {
                            $fail('Ukuran foto maksimal 5 MB.');
                        }
                    } else {
                        if (! in_array($ext, ['pdf', 'doc', 'docx', 'odt', 'txt'])) {
                            $fail('File notulen harus berformat pdf, doc, docx, odt, atau txt.');
                        }
                        if ($value->getSize() > 20 * 1024 * 1024) {
                            $fail('Ukuran notulen maksimal 20 MB.');
                        }
                    }
                },
            ],
        ]);

        $path = $validated['file']->store(
            "dokumentasi/{$team->id}/{$kegiatan->id}",
            'local'
        );

        $kegiatan->dokumentasi()->create([
            'tipe' => $validated['tipe'],
            'file_path' => $path,
            'uploaded_by' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Dokumentasi berhasil diupload.');
    }

    /**
     * GET /{team}/dokumentasi/{dokumentasi}/file
     * Serve file terproteksi — hanya Member Team yang sama.
     */
    public function download(
        Request $request,
        string $currentTeam,
        Dokumentasi $dokumentasi
    ): BinaryFileResponse {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $dokumentasi->load('kegiatan');

        abort_if(
            $dokumentasi->kegiatan->team_id !== $team->id,
            403
        );

        abort_if(
            ! $request->user()->belongsToTeam($team),
            403
        );

        abort_if(
            ! Storage::disk('local')->exists($dokumentasi->file_path),
            404
        );

        return response()->file(
            Storage::disk('local')->path($dokumentasi->file_path),
            [
                'Content-Disposition' => 'inline',
            ]
        );
    }

    /**
     * DELETE /{team}/pengurus/dokumentasi/{dokumentasi}
     */
    public function destroy(Request $request, string $currentTeam, Dokumentasi $dokumentasi): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $dokumentasi->load('kegiatan');
        abort_if($dokumentasi->kegiatan->team_id !== $team->id, 403);

        // Hapus file fisik dulu
        Storage::disk('local')->delete($dokumentasi->file_path);

        $dokumentasi->delete();

        return redirect()->back()->with('success', 'Dokumentasi berhasil dihapus.');
    }
}
