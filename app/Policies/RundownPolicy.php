<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi modul Rundown per Kegiatan (SRS §3.2, FR-10).
 *
 * manage() → Pengurus, Ketua Pelaksana, Div Acara
 *
 * Dipanggil via $this->authorize('rundown.manage', $kegiatan).
 */
class RundownPolicy
{
    /**
     * Kelola Rundown (create, update, delete) untuk Kegiatan ini.
     * Div Acara bertanggung jawab atas rundown acara (FR-10).
     */
    public function manage(User $user, Kegiatan $kegiatan): bool
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

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::DivAcara);
    }
}
