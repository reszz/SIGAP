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
     * Cache koordinator per kombinasi (user_id, kegiatan_id).
     *
     * @var array<string, array<JabatanKepanitiaan>>
     */
    private static array $koordinatorCache = [];

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
     * Cek apakah user adalah Koordinator Divisi tertentu di Kegiatan ini.
     */
    public static function isKoordinator(
        User $user,
        Kegiatan|int $kegiatan,
        JabatanKepanitiaan|string $jabatan
    ): bool {
        if ($user->isSuperAdmin()) {
            return true;
        }

        $kegiatanId = $kegiatan instanceof Kegiatan ? $kegiatan->id : $kegiatan;
        $jabatanValue = $jabatan instanceof JabatanKepanitiaan ? $jabatan->value : $jabatan;
        $cacheKey = "koor:{$user->id}:{$kegiatanId}";

        if (! array_key_exists($cacheKey, self::$koordinatorCache)) {
            self::$koordinatorCache[$cacheKey] = Kepanitiaan::where('kegiatan_id', $kegiatanId)
                ->where('user_id', $user->id)
                ->where('is_koordinator', true)
                ->pluck('jabatan')
                ->map(fn ($j) => $j instanceof JabatanKepanitiaan ? $j->value : $j)
                ->all();
        }

        return in_array($jabatanValue, self::$koordinatorCache[$cacheKey]);
    }

    /**
     * Kembalikan semua divisi yang dikoordinatori oleh user di Kegiatan ini.
     *
     * @return array<string> array of jabatan values
     */
    public static function divisiKoordinatorUser(User $user, Kegiatan|int $kegiatan): array
    {
        $kegiatanId = $kegiatan instanceof Kegiatan ? $kegiatan->id : $kegiatan;
        $cacheKey = "koor:{$user->id}:{$kegiatanId}";

        if (! array_key_exists($cacheKey, self::$koordinatorCache)) {
            self::$koordinatorCache[$cacheKey] = Kepanitiaan::where('kegiatan_id', $kegiatanId)
                ->where('user_id', $user->id)
                ->where('is_koordinator', true)
                ->pluck('jabatan')
                ->map(fn ($j) => $j instanceof JabatanKepanitiaan ? $j->value : $j)
                ->all();
        }

        return self::$koordinatorCache[$cacheKey];
    }

    /**
     * Cek apakah user adalah Super Admin, Pengurus, ATAU Ketua Pelaksana di Kegiatan ini.
     * Ini adalah "akses penuh per-kegiatan" yang paling sering dibutuhkan.
     */
    public static function isPengurusAtauKetua(User $user, Kegiatan|int $kegiatan): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isPembina()) {
            return false;
        }

        if ($user->isPengurus()) {
            return true;
        }

        return self::punyaJabatan($user, $kegiatan, JabatanKepanitiaan::KetuaPelaksana);
    }

    /**
     * Cek apakah user memiliki izin penulisan/modifikasi administratif secara umum.
     */
    public static function canWrite(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isPembina()) {
            return false;
        }

        return $user->isPengurus();
    }

    /**
     * Reset cache — berguna untuk testing agar antar-test tidak saling polusi.
     */
    public static function flushCache(): void
    {
        self::$cache = [];
        self::$koordinatorCache = [];
    }
}
