<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnggotaPeriode extends Model
{
    use HasFactory;

    protected $table = 'anggota_periode';

    protected $fillable = [
        'user_id',
        'periode_id',
        'divisi_organisasi_id',
        'jabatan',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class);
    }

    public function divisiOrganisasi(): BelongsTo
    {
        return $this->belongsTo(DivisiOrganisasi::class, 'divisi_organisasi_id');
    }
}
