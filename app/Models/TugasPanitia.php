<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TugasPanitia extends Model
{
    use HasFactory;

    protected $table = 'tugas_panitia';

    protected $fillable = ['divisi_id', 'user_id', 'status', 'deskripsi_tugas'];

    public function divisiPanitia(): BelongsTo
    {
        return $this->belongsTo(DivisiPanitia::class, 'divisi_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
