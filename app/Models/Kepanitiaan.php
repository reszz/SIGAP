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

    protected $fillable = ['kegiatan_id', 'user_id', 'jabatan', 'is_koordinator'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jabatan' => JabatanKepanitiaan::class,
            'is_koordinator' => 'boolean',
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
     * Koordinator hanya berlaku untuk divisi (div_acara, div_humas, div_pdd, div_logistik).
     *
     * @throws \RuntimeException jika jabatan tunggal sudah terisi atau koordinator di-assign ke jabatan tunggal
     */
    public static function assign(
        int $kegiatanId,
        int $userId,
        JabatanKepanitiaan $jabatan,
        bool $isKoordinator = false
    ): self {
        $user = User::find($userId);
        if ($user && $user->isPembina()) {
            throw new \RuntimeException('Pembina tidak dapat ditugaskan ke dalam kepanitiaan kegiatan.');
        }

        if ($jabatan->isTunggal()) {
            if ($isKoordinator) {
                throw new \RuntimeException(
                    'Jabatan inti (ketua pelaksana/bendahara/sekretaris) tidak dapat di-assign sebagai koordinator divisi.'
                );
            }

            $existing = self::where('kegiatan_id', $kegiatanId)
                ->where('jabatan', $jabatan->value)
                ->first();

            if ($existing !== null) {
                throw new \RuntimeException(
                    "Jabatan \"{$jabatan->label()}\" sudah diisi oleh anggota lain pada Kegiatan ini. ".
                    'Harap hapus jabatan lama terlebih dahulu sebelum assign ulang.'
                );
            }
        } elseif ($isKoordinator) {
            // Unset koordinator lama jika divisi sudah memiliki koordinator sebelumnya
            self::where('kegiatan_id', $kegiatanId)
                ->where('jabatan', $jabatan->value)
                ->where('is_koordinator', true)
                ->update(['is_koordinator' => false]);
        }

        return self::create([
            'kegiatan_id' => $kegiatanId,
            'user_id' => $userId,
            'jabatan' => $jabatan->value,
            'is_koordinator' => $isKoordinator,
        ]);
    }

    /**
     * Set atau cabut status koordinator divisi.
     *
     * @throws \RuntimeException jika diterapkan pada jabatan inti
     */
    public function setKoordinator(bool $status = true): self
    {
        if ($status) {
            if ($this->jabatan->isTunggal()) {
                throw new \RuntimeException(
                    'Jabatan inti tidak dapat dijadikan sebagai koordinator divisi.'
                );
            }

            // Unset koordinator lain di divisi yang sama pada kegiatan ini
            self::where('kegiatan_id', $this->kegiatan_id)
                ->where('jabatan', $this->jabatan->value)
                ->where('id', '!=', $this->id)
                ->where('is_koordinator', true)
                ->update(['is_koordinator' => false]);

            $this->update(['is_koordinator' => true]);
        } else {
            $this->update(['is_koordinator' => false]);
        }

        return $this;
    }
}
