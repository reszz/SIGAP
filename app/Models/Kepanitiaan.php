<?php

namespace App\Models;

use App\Enums\JabatanKepanitiaan;
use Database\Factories\KepanitiaanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kepanitiaan extends Model
{
    /** @use HasFactory<KepanitiaanFactory> */
    use HasFactory;

    protected $table = 'kepanitiaan';

    protected $fillable = ['kegiatan_id', 'user_id', 'jabatan'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jabatan' => JabatanKepanitiaan::class,
        ];
    }

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Assign anggota ke jabatan dalam sebuah Kegiatan.
     *
     * Untuk jabatan tunggal (ketua_pelaksana, bendahara, sekretaris):
     * mencegah duplikasi jabatan yang sama di Kegiatan yang sama (FR-28, NFR-03).
     * Divisi boleh banyak anggota — tidak ada cek untuk jabatan divisi.
     *
     * @throws \RuntimeException jika jabatan tunggal sudah terisi
     */
    public static function assign(int $kegiatanId, int $userId, JabatanKepanitiaan $jabatan): self
    {
        if ($jabatan->isTunggal()) {
            $existing = self::where('kegiatan_id', $kegiatanId)
                ->where('jabatan', $jabatan->value)
                ->first();

            if ($existing !== null) {
                throw new \RuntimeException(
                    "Jabatan \"{$jabatan->label()}\" sudah diisi oleh anggota lain pada Kegiatan ini. ".
                    'Harap hapus jabatan lama terlebih dahulu sebelum assign ulang.'
                );
            }
        }

        return self::create([
            'kegiatan_id' => $kegiatanId,
            'user_id' => $userId,
            'jabatan' => $jabatan->value,
        ]);
    }
}
