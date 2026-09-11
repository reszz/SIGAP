<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DivisiOrganisasi extends Model
{
    use HasFactory;

    protected $table = 'divisi_organisasi';

    protected $fillable = [
        'team_id',
        'nama_divisi',
        'deskripsi',
        'urutan_tampil',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function pengurus(): HasMany
    {
        return $this->hasMany(PengurusStruktur::class, 'divisi_organisasi_id')->orderBy('urutan_tampil');
    }
}
