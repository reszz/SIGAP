<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Sesi extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sesi';

    protected $fillable = ['kegiatan_id', 'tanggal', 'waktu_mulai', 'waktu_selesai', 'lokasi', 'kode_presensi'];

    protected function casts(): array
    {
        return ['tanggal' => 'date:Y-m-d'];
    }

    protected $appends = ['status'];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function rundown(): HasMany
    {
        return $this->hasMany(Rundown::class)->orderBy('urutan');
    }

    public function presensi(): HasMany
    {
        return $this->hasMany(Presensi::class);
    }

    // Dihitung on-the-fly, BUKAN kolom database â€” lihat SIGAP-DataDictionary.md Â§3
    public function getStatusAttribute(): string
    {
        // Ensure we have a valid Carbon instance even if the column is null
        $tanggal = $this->tanggal ? clone $this->tanggal : now();

        // Use native PHP clone instead of ->copy()
        $mulai = (clone $tanggal)->setTimeFromTimeString($this->waktu_mulai);
        $selesai = (clone $tanggal)->setTimeFromTimeString($this->waktu_selesai);

        $now = now();

        if ($now->lt($mulai)) {
            return 'terjadwal';
        }

        if ($now->between($mulai, $selesai)) {
            return 'berlangsung';
        }

        return 'selesai';
    }

    protected static function booted(): void
    {
        static::creating(function (Sesi $sesi) {
            $sesi->kode_presensi ??= Str::random(24);
        });
    }
}
