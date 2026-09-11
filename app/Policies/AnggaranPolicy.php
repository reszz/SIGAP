<?php

namespace App\Policies;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\User;
use App\Services\KegiatanAuthService;

/**
 * Otorisasi modul Anggaran per Kegiatan (SRS §3.8, FR-35/FR-36).
 *
 * Didaftarkan via Gate::define() di AppServiceProvider — dipanggil dengan
 * $this->authorize('anggaran.manage', $kegiatan) di controller.
 *
 * manage()       → Pengurus, Ketua Pelaksana, Bendahara
 * manageLogistik() → semua yang bisa manage() + Div Logistik
 */
class AnggaranPolicy
{
    /**
     * Akses penuh ke seluruh Anggaran Kegiatan.
     * Bendahara dapat akses penuh seluruh baris (pemasukan & pengeluaran).
     */
    public function manage(User $user, Kegiatan $kegiatan): bool
    {
        if (KegiatanAuthService::isPengurusAtauKetua($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::Bendahara);
    }

    /**
     * Akses untuk input baris pengeluaran kategori logistik.
     * Semua yang bisa manage() + Div Logistik.
     *
     * Catatan: pembatasan ke kategori logistik divalidasi di controller/service,
     * bukan di sini — policy hanya gate "apakah boleh akses modul anggaran sama sekali".
     */
    public function manageLogistik(User $user, Kegiatan $kegiatan): bool
    {
        if ($this->manage($user, $kegiatan)) {
            return true;
        }

        return KegiatanAuthService::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::DivLogistik);
    }
}
