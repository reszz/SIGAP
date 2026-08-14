<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kegiatan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'kegiatan';

    protected $fillable = [
        'team_id',
        'nama',
        'deskripsi',
        'tipe',
        'kuota',
        'warna',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function sesi(): HasMany
    {
        return $this->hasMany(Sesi::class);
    }

    public function divisiPanitia(): HasMany
    {
        return $this->hasMany(DivisiPanitia::class);
    }

    public function rsvp(): HasMany
    {
        return $this->hasMany(Rsvp::class);
    }

    public function anggaran(): HasMany
    {
        return $this->hasMany(Anggaran::class);
    }

    public function dokumentasi(): HasMany
    {
        return $this->hasMany(Dokumentasi::class);
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class);
    }

    // FR-13: kuota hanya dihitung dari RSVP status = terdaftar
    public function sisaKuota(): ?int
    {
        if ($this->tipe !== 'terbuka') {
            return null;
        }

        return $this->kuota - $this->rsvp()->where('status', 'terdaftar')->count();
    }
}
