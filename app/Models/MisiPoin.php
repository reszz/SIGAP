<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MisiPoin extends Model
{
    use HasFactory;

    protected $table = 'misi_poin';

    protected $fillable = [
        'visi_misi_id',
        'isi',
        'urutan',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'urutan' => 'integer',
        ];
    }

    public function visiMisi(): BelongsTo
    {
        return $this->belongsTo(VisiMisi::class, 'visi_misi_id');
    }
}
