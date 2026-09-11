<?php

namespace App\Models;

use Database\Factories\SuratFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Surat extends Model
{
    /** @use HasFactory<SuratFactory> */
    use HasFactory;

    protected $table = 'surat';

    protected $fillable = [
        'kegiatan_id',
        'tipe',
        'nomor_surat',
        'jenis_surat',
        'perihal',
        'tanggal_surat',
        'pengirim_penerima',
        'file_path',
        'keterangan',
        'dibuat_oleh',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_surat' => 'date',
        ];
    }

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }

    public function isMasuk(): bool
    {
        return $this->tipe === 'masuk';
    }

    public function isKeluar(): bool
    {
        return $this->tipe === 'keluar';
    }
}
