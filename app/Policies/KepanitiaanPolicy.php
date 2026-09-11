<?php

namespace App\Policies;

use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi untuk kelola Kepanitiaan (assign jabatan ke anggota).
 * Hanya Pengurus atau Ketua Pelaksana kegiatan tersebut yang boleh assign.
 * Jabatan divisi lain tidak berwenang.
 */
class KepanitiaanPolicy
{
    /**
     * Pengurus (semua kegiatan) atau Ketua Pelaksana (kegiatan itu saja)
     * dapat mengelola kepanitiaan suatu Kegiatan.
     */
    public function manage(User $user, Kegiatan $kegiatan): bool
    {
        return KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan);
    }
}
