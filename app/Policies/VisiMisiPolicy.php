<?php

namespace App\Policies;

use App\Models\Periode;
use App\Models\User;

class VisiMisiPolicy
{
    /**
     * Menentukan apakah user dapat melihat halaman Visi & Misi.
     * Pengurus, Super Admin, dan Pembina dapat melihat (read-only untuk pembina atau periode arsip).
     */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isPengurus() || $user->isPembina();
    }

    /**
     * Menentukan apakah user dapat mengelola (create/update/delete/reorder) Visi & Misi.
     * Hanya boleh untuk Super Admin dan Pengurus, DAN HANYA pada periode yang sedang aktif.
     * Semua role (termasuk Super Admin) ditolak jika periode bukan periode aktif.
     */
    public function manage(User $user, ?Periode $periode = null): bool
    {
        if (! $periode || ! $periode->is_aktif) {
            return false;
        }

        if ($user->isPembina() || $user->isAnggota()) {
            return false;
        }

        return $user->isSuperAdmin() || $user->isPengurus();
    }
}
