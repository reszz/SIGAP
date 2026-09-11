<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Periode extends Model
{
    use HasFactory;

    protected $table = 'periodes';

    protected $fillable = [
        'team_id',
        'nama',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_aktif',
        'created_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal_mulai' => 'date',
            'tanggal_selesai' => 'date',
            'is_aktif' => 'boolean',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function anggotaPeriode(): HasMany
    {
        return $this->hasMany(AnggotaPeriode::class, 'periode_id');
    }

    public function anggota(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'anggota_periode', 'periode_id', 'user_id')
            ->withPivot(['divisi_organisasi_id', 'jabatan', 'status'])
            ->withTimestamps();
    }

    public function kegiatan(): HasMany
    {
        return $this->hasMany(Kegiatan::class, 'periode_id');
    }

    public function visiMisi(): HasOne
    {
        return $this->hasOne(VisiMisi::class, 'periode_id');
    }

    /**
     * Determine whether this is the latest period in the team based on tanggal_mulai / id.
     */
    public function isLatest(): bool
    {
        $latestId = static::where('team_id', $this->team_id)
            ->orderByDesc('tanggal_mulai')
            ->orderByDesc('id')
            ->value('id');

        return (int) $this->id === (int) $latestId;
    }
}
