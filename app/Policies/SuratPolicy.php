<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi modul Surat Menyurat per Kegiatan (SRS §3.11, FR-45/FR-46/FR-48).
 *
 * manageSurat()       → Pengurus, Ketua Pelaksana, Sekretaris
 *                       (semua tipe: masuk & keluar)
 * manageSuratKeluar() → semua yang bisa manageSurat() + Div Humas
 *                       (hanya surat keluar)
 *
 * Dipanggil via:
 *   $this->authorize('surat.manage', $kegiatan)        — untuk surat masuk/keluar
 *   $this->authorize('surat.manage-keluar', $kegiatan) — untuk surat keluar saja
 */
class SuratPolicy
{
    /**
     * Kelola semua surat (masuk dan keluar) untuk Kegiatan ini (FR-45).
     * Sekretaris punya akses penuh ke kedua tipe.
     */
    public function manageSurat(User $user, Kegiatan $kegiatan): bool
    {
        if (KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::Sekretaris);
    }

    /**
     * Kelola surat keluar saja untuk Kegiatan ini (FR-46).
     * Div Humas hanya boleh surat keluar — subset dari akses Sekretaris.
     * Semua yang bisa manageSurat() otomatis bisa manageSuratKeluar().
     */
    public function manageSuratKeluar(User $user, Kegiatan $kegiatan): bool
    {
        if ($this->manageSurat($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::DivHumas);
    }
}
