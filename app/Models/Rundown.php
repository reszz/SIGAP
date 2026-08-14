<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Rundown extends Model
{
    protected $table = 'rundown';

    protected $fillable = ['sesi_id', 'waktu', 'uraian_acara', 'urutan'];

    public function sesi(): BelongsTo
    {
        return $this->belongsTo(Sesi::class);
    }
}
