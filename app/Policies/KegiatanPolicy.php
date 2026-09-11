<?php

namespace App\Policies;

use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi untuk kelola Kegiatan (edit, hapus, kelola sesi, assign panitia).
 * Layer 2 (Pengurus) + Layer 3 (Ketua Pelaksana kegiatan itu).
 */
class KegiatanPolicy
{
    /**
     * Pengurus dapat kelola SEMUA Kegiatan dalam Team-nya.
     * Ketua Pelaksana dapat kelola HANYA Kegiatan yang dia pimpin.
     */
    public function manage(User $user, Kegiatan $kegiatan): bool
    {
        return KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan);
    }
}
