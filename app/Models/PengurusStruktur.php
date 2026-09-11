<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class PengurusStruktur extends Model
{
    use HasFactory;

    protected $table = 'pengurus_struktur';

    protected $fillable = [
        'team_id',
        'nama',
        'jabatan',
        'divisi_organisasi_id',
        'foto_path',
        'urutan_tampil',
        'periode',
    ];

    protected $appends = ['foto_url'];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function divisi(): BelongsTo
    {
        return $this->belongsTo(DivisiOrganisasi::class, 'divisi_organisasi_id');
    }

    public function getFotoUrlAttribute(): ?string
    {
        if (! $this->foto_path) {
            return null;
        }

        return Storage::url($this->foto_path);
    }
}
