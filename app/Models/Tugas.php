<?php

namespace App\Models;

use App\Enums\JabatanTugas;
use App\Enums\PrioritasTugas;
use Database\Factories\TugasFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tugas extends Model
{
    /** @use HasFactory<TugasFactory> */
    use HasFactory;

    protected $table = 'tugas';

    protected $fillable = [
        'kegiatan_id',
        'jabatan',
        'pic_user_id',
        'dibuat_oleh',
        'deskripsi_tugas',
        'status',
        'prioritas',
        'deadline',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'jabatan' => JabatanTugas::class,
            'prioritas' => PrioritasTugas::class,
            'deadline' => 'date',
        ];
    }

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    /**
     * User yang menjadi PIC (Person-in-Charge) tugas ini.
     */
    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_user_id');
    }

    /**
     * User yang membuat tugas ini.
     */
    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    /**
     * Buat Tugas baru dengan validasi bahwa PIC adalah anggota divisi yang relevan.
     *
     * PIC wajib memiliki baris Kepanitiaan dengan (kegiatan_id, jabatan, user_id)
     * yang cocok dengan jabatan tugas ini (FR-32, NFR-04).
     *
     * @param  array{
     *     kegiatan_id: int,
     *     jabatan: JabatanTugas,
     *     pic_user_id: int,
     *     dibuat_oleh: int,
     *     deskripsi_tugas: string,
     *     status?: string,
     *     prioritas?: PrioritasTugas,
     *     deadline?: string|null,
     * } $data
     *
     * @throws \RuntimeException jika pic_user_id bukan anggota divisi yang sesuai
     */
    public static function createWithValidation(array $data): self
    {
        $jabatan = $data['jabatan'] instanceof JabatanTugas
            ? $data['jabatan']
            : JabatanTugas::from($data['jabatan']);

        $isMember = Kepanitiaan::where('kegiatan_id', $data['kegiatan_id'])
            ->where('jabatan', $jabatan->value)
            ->where('user_id', $data['pic_user_id'])
            ->exists();

        if (! $isMember) {
            throw new \RuntimeException(
                "PIC yang dipilih bukan anggota {$jabatan->label()} pada Kegiatan ini. ".
                'Hanya anggota divisi yang sama dapat di-assign sebagai PIC.'
            );
        }

        return self::create([
            ...$data,
            'jabatan' => $jabatan->value,
            'prioritas' => isset($data['prioritas'])
                ? ($data['prioritas'] instanceof PrioritasTugas ? $data['prioritas']->value : $data['prioritas'])
                : PrioritasTugas::Sedang->value,
            'status' => $data['status'] ?? 'belum',
        ]);
    }
}
