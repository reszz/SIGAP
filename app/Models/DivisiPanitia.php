<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DivisiPanitia extends Model
{
    use HasFactory;

    protected $table = 'divisi_panitia';

    protected $fillable = ['kegiatan_id', 'nama_divisi'];

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function tugasPanitia(): HasMany
    {
        return $this->hasMany(TugasPanitia::class, 'divisi_id');
    }
}
