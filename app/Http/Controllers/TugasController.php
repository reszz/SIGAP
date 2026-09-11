<?php

namespace App\Http\Controllers;

use App\Enums\JabatanTugas;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Tugas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TugasController extends Controller
{
    /**
     * PATCH /{team}/tugas/{tugas}/status
     * Hanya PIC tugas yang boleh ubah status tugasnya sendiri.
     * Route ini di shared group (tidak butuh role pengurus).
     */
    public function updateStatus(Request $request, string $currentTeam, Tugas $tugas): RedirectResponse
    {
        $this->authorize('updateStatus', $tugas);

        $validated = $request->validate([
            'status' => 'required|in:belum,sedang,selesai',
        ]);

        $tugas->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Status tugas diperbarui.');
    }

    /**
     * POST /{team}/pengurus/kegiatan/{kegiatan}/tugas
     * Buat tugas baru. Pakai Tugas::createWithValidation() agar PIC
     * divalidasi sebagai anggota divisi yang sama (FR-32).
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'jabatan' => 'required|in:div_acara,div_humas,div_pdd,div_logistik',
            'pic_user_id' => 'required|exists:users,id',
            'deskripsi_tugas' => 'required|string|max:255',
            'prioritas' => 'required|in:rendah,sedang,tinggi',
            'deadline' => 'nullable|date',
        ]);

        // Bangun model sementara untuk authorize() — manage() butuh $tugas->jabatan & kegiatan_id
        $tugasSementara = new Tugas([
            'kegiatan_id' => $kegiatan->id,
            'jabatan' => $validated['jabatan'],
        ]);
        $this->authorize('manage', $tugasSementara);

        // createWithValidation() memvalidasi PIC harus anggota divisi yang sama (FR-32)
        // Lempar RuntimeException kalau PIC tidak valid → tangkap dan kembalikan error
        try {
            Tugas::createWithValidation([
                ...$validated,
                'kegiatan_id' => $kegiatan->id,
                'jabatan' => JabatanTugas::from($validated['jabatan']),
                'dibuat_oleh' => $request->user()->id,
            ]);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['pic_user_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Tugas berhasil dibuat.');
    }

    /**
     * PATCH /{team}/pengurus/tugas/{tugas}
     * Edit deskripsi, prioritas, deadline, atau ganti PIC.
     * Kalau pic_user_id diganti, validasi ulang bahwa PIC masih anggota divisi yang sama.
     */
    public function update(Request $request, string $currentTeam, Tugas $tugas): RedirectResponse
    {
        $this->authorize('manage', $tugas);

        $validated = $request->validate([
            'deskripsi_tugas' => 'sometimes|string|max:255',
            'prioritas' => 'sometimes|in:rendah,sedang,tinggi',
            'deadline' => 'nullable|date',
            'pic_user_id' => 'sometimes|exists:users,id',
        ]);

        // Kalau pic_user_id diganti, validasi PIC masih anggota divisi yang sama (FR-32)
        if (isset($validated['pic_user_id']) && $validated['pic_user_id'] !== $tugas->pic_user_id) {
            $picValid = Kepanitiaan::where('kegiatan_id', $tugas->kegiatan_id)
                ->where('jabatan', $tugas->jabatan->value)
                ->where('user_id', $validated['pic_user_id'])
                ->exists();

            if (! $picValid) {
                return back()->withErrors([
                    'pic_user_id' => 'PIC harus anggota divisi yang sama dengan tugas ini.',
                ]);
            }
        }

        $tugas->update($validated);

        return back()->with('success', 'Tugas berhasil diperbarui.');
    }

    /**
     * DELETE /{team}/pengurus/tugas/{tugas}
     */
    public function destroy(string $currentTeam, Tugas $tugas): RedirectResponse
    {
        $this->authorize('manage', $tugas);

        $tugas->delete();

        return back()->with('success', 'Tugas berhasil dihapus.');
    }
}
