<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Enums\JabatanTugas;
use App\Models\Tugas;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi untuk Tugas (SRS §3.7, FR-31/FR-33).
 *
 * manage()       → Pengurus, Ketua Pelaksana, atau anggota Divisi yang SAMA
 *                  dengan jabatan tugas — anggota Div Acara TIDAK bisa manage
 *                  tugas Div Humas, meski keduanya di Kegiatan yang sama.
 * updateStatus() → PIC tugas itu sendiri, Pengurus, Ketua Pelaksana.
 */
class TugasPolicy
{
    /**
     * Boleh membuat, mengedit, atau menghapus Tugas (FR-31).
     *
     * Aturan per SRS §3.7:
     * - Pengurus atau Ketua Pelaksana Kegiatan tersebut → selalu boleh
     * - Anggota Divisi X → hanya boleh manage tugas untuk Divisi X yang sama
     */
    public function manage(User $user, Tugas $tugas): bool
    {
        if (KegiatanAuthService::isPengurusAtauKetua($user, $tugas->kegiatan_id)) {
            return true;
        }

        $jabatanDibutuhkan = $this->toJabatanKepanitiaan($tugas->jabatan);

        if ($jabatanDibutuhkan === null) {
            return false;
        }

        return KegiatanAuthService::punyaJabatan($user, $tugas->kegiatan_id, $jabatanDibutuhkan);
    }

    /**
     * PIC (person-in-charge) boleh mengubah status tugasnya sendiri (FR-33).
     * Pengurus dan Ketua Pelaksana juga boleh.
     */
    public function updateStatus(User $user, Tugas $tugas): bool
    {
        if ($tugas->pic_user_id === $user->id) {
            return true;
        }

        return KegiatanAuthService::isPengurusAtauKetua($user, $tugas->kegiatan_id);
    }

    private function toJabatanKepanitiaan(JabatanTugas $jabatan): ?JabatanKepanitiaan
    {
        return match ($jabatan) {
            JabatanTugas::DivAcara => JabatanKepanitiaan::DivAcara,
            JabatanTugas::DivHumas => JabatanKepanitiaan::DivHumas,
            JabatanTugas::DivPdd => JabatanKepanitiaan::DivPdd,
            JabatanTugas::DivLogistik => JabatanKepanitiaan::DivLogistik,
        };
    }
}
