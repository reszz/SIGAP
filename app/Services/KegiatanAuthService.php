<?php

namespace App\Services;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\User;

/**
 * Helper terpusat untuk cek jabatan seorang User dalam sebuah Kegiatan.
 *
 * Semua Policy yang butuh cek kepanitiaan HARUS melalui service ini,
 * bukan query langsung ke tabel kepanitiaan — untuk menghindari duplikasi
 * dan agar caching per-request berjalan efektif.
 */
class KegiatanAuthService
{
    /**
     * Cache hasil query jabatan per kombinasi (user_id, kegiatan_id)
     * dalam satu request lifecycle.
     *
     * @var array<string, JabatanKepanitiaan|null>
     */
    private static array $cache = [];

    /**
     * Kembalikan jabatan User di Kegiatan tertentu, atau null kalau tidak ada.
     *
     * Catatan: user bisa punya BANYAK jabatan di kegiatan yang sama
     * (misal anggota div_acara sekaligus div_humas — walau tidak umum).
     * Method ini return jabatan PERTAMA yang ditemukan.
     * Kalau butuh cek semua jabatan, gunakan jabatanDiAll().
     */
    public static function jabatanDi(User $user, Kegiatan|int $kegiatan): ?JabatanKepanitiaan
    {
        $kegiatanId = $kegiatan instanceof Kegiatan ? $kegiatan->id : $kegiatan;
        $cacheKey = "{$user->id}:{$kegiatanId}";

        if (! array_key_exists($cacheKey, self::$cache)) {
            $row = Kepanitiaan::where('kegiatan_id', $kegiatanId)
                ->where('user_id', $user->id)
                ->first();

            self::$cache[$cacheKey] = $row?->jabatan;
        }

        return self::$cache[$cacheKey];
    }

    /**
     * Kembalikan SEMUA jabatan User di Kegiatan tertentu.
     * Berguna saat user bisa menjabat di lebih dari satu divisi.
     *
     * @return array<JabatanKepanitiaan>
     */
    public static function jabatanDiAll(User $user, Kegiatan|int $kegiatan): array
    {
        $kegiatanId = $kegiatan instanceof Kegiatan ? $kegiatan->id : $kegiatan;

        return Kepanitiaan::where('kegiatan_id', $kegiatanId)
            ->where('user_id', $user->id)
            ->pluck('jabatan')
            ->map(fn ($j) => $j instanceof JabatanKepanitiaan ? $j : JabatanKepanitiaan::from($j))
            ->all();
    }

    /**
     * Cek apakah user memiliki jabatan tertentu di Kegiatan ini.
     */
    public static function punyaJabatan(User $user, Kegiatan|int $kegiatan, JabatanKepanitiaan $jabatan): bool
    {
        $kegiatanId = $kegiatan instanceof Kegiatan ? $kegiatan->id : $kegiatan;

        return Kepanitiaan::where('kegiatan_id', $kegiatanId)
            ->where('user_id', $user->id)
            ->where('jabatan', $jabatan->value)
            ->exists();
    }

    /**
     * Cek apakah user adalah Pengurus (Team Role) ATAU Ketua Pelaksana di Kegiatan ini.
     * Ini adalah "akses penuh per-kegiatan" yang paling sering dibutuhkan.
     */
    public static function isPengurusAtauKetua(User $user, Kegiatan|int $kegiatan): bool
    {
        if ($user->isPengurus()) {
            return true;
        }

        return self::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::KetuaPelaksana);
    }

    /**
     * Reset cache — berguna untuk testing agar antar-test tidak saling polusi.
     */
    public static function flushCache(): void
    {
        self::$cache = [];
    }
}
