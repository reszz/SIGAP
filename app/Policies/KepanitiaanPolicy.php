<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi untuk kelola Kepanitiaan (assign jabatan ke anggota).
 *
 * manage()                → Pengurus atau Ketua Pelaksana (jabatan inti & semua divisi)
 * manageAnggotaDivisi()   → Pengurus, Ketua Pelaksana, ATAU Koordinator Divisi itu sendiri
 *                           (tapi Koordinator TIDAK bisa assign/cabut sesama koordinator)
 * setKoordinator()        → hanya Pengurus atau Ketua Pelaksana
 */
class KepanitiaanPolicy
{
    /**
     * Pengurus (semua kegiatan) atau Ketua Pelaksana (kegiatan itu saja)
     * dapat mengelola kepanitiaan suatu Kegiatan (jabatan inti).
     */
    public function manage(User $user, Kegiatan $kegiatan): bool
    {
        return KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan);
    }

    /**
     * Cek apakah user boleh menambah/menghapus anggota biasa ke Divisi tertentu.
     *
     * Diizinkan jika:
     * - Pengurus atau Ketua Pelaksana (override penuh), ATAU
     * - User adalah Koordinator Divisi yang sama dan target bukan sesama koordinator
     *
     * @param  Kepanitiaan|null  $target  Baris kepanitiaan yang akan dihapus (null = operasi tambah)
     */
    public function manageAnggotaDivisi(
        User $user,
        Kegiatan $kegiatan,
        JabatanKepanitiaan $jabatan,
        ?Kepanitiaan $target = null
    ): bool {
        if (KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan)) {
            return true;
        }

        // Koordinator hanya untuk jabatan divisi
        if (! $jabatan->isDivisi()) {
            return false;
        }

        // Cek apakah user adalah koordinator divisi ini
        if (! KegiatanAuthService::isKoordinator($user, $kegiatan, $jabatan)) {
            return false;
        }

        // Koordinator tidak boleh menghapus sesama koordinator (target->is_koordinator = true)
        if ($target !== null && $target->is_koordinator) {
            return false;
        }

        return true;
    }

    /**
     * Hanya Pengurus atau Ketua Pelaksana yang boleh set/unset koordinator.
     */
    public function setKoordinator(User $user, Kegiatan $kegiatan): bool
    {
        return KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan);
    }
}
