<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VisiMisi extends Model
{
    use HasFactory;

    protected $table = 'visi_misi';

    protected $fillable = [
        'periode_id',
        'visi',
    ];

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function misiPoin(): HasMany
    {
        return $this->hasMany(MisiPoin::class, 'visi_misi_id')->orderBy('urutan');
    }

    /**
     * Mengambil Visi & Misi untuk landing page publik.
     * Mengutamakan periode aktif. Jika belum ada data di periode aktif,
     * fallback mundur ke periode sebelumnya yang memiliki data visi-misi.
     */
    public static function untukLandingPage(): ?self
    {
        $activePeriode = Periode::where('is_aktif', true)->first();

        if ($activePeriode) {
            $visiMisi = static::with(['periode', 'misiPoin' => fn ($q) => $q->orderBy('urutan')])
                ->where('periode_id', $activePeriode->id)
                ->first();

            if ($visiMisi) {
                return $visiMisi;
            }

            // Fallback mundur: cari periode sebelum periode aktif berdasarkan tanggal_mulai
            $fallbackPeriodeIds = Periode::where('tanggal_mulai', '<=', $activePeriode->tanggal_mulai)
                ->where('id', '!=', $activePeriode->id)
                ->orderByDesc('tanggal_mulai')
                ->orderByDesc('id')
                ->pluck('id');

            foreach ($fallbackPeriodeIds as $periodeId) {
                $candidate = static::with(['periode', 'misiPoin' => fn ($q) => $q->orderBy('urutan')])
                    ->where('periode_id', $periodeId)
                    ->first();

                if ($candidate) {
                    return $candidate;
                }
            }
        }

        // Fallback global jika tidak ada periode aktif: ambil periode terbaru yang memiliki data
        return static::with(['periode', 'misiPoin' => fn ($q) => $q->orderBy('urutan')])
            ->whereHas('periode')
            ->join('periodes', 'periodes.id', '=', 'visi_misi.periode_id')
            ->orderByDesc('periodes.tanggal_mulai')
            ->orderByDesc('periodes.id')
            ->select('visi_misi.*')
            ->first();
    }
}
