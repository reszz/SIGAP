<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi modul Dokumentasi per Kegiatan (SRS §3.10, FR-41/FR-42/FR-44).
 *
 * uploadFoto()    → Pengurus, Ketua Pelaksana, Div PDD
 * uploadNotulen() → Pengurus, Ketua Pelaksana, Sekretaris
 *
 * Dipanggil via $this->authorize('dokumentasi.upload-foto', $kegiatan)
 * atau $this->authorize('dokumentasi.upload-notulen', $kegiatan).
 */
class DokumentasiPolicy
{
    /**
     * Upload dokumentasi tipe foto (FR-41).
     * Hanya Div PDD (atau Pengurus/Ketua) yang boleh upload foto.
     */
    public function uploadFoto(User $user, Kegiatan $kegiatan): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isPembina()) {
            return false;
        }

        if (KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::DivPdd);
    }

    /**
     * Upload dokumentasi tipe notulen (FR-42).
     * Hanya Sekretaris (atau Pengurus/Ketua) yang boleh upload notulen.
     */
    public function uploadNotulen(User $user, Kegiatan $kegiatan): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isPembina()) {
            return false;
        }

        if (KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::Sekretaris);
    }
}
