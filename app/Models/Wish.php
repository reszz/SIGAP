<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Wish extends Model
{
    use HasFactory;

    protected $table = 'wish';

    protected $fillable = [
        'team_id',
        'nama_pengirim',
        'pesan',
        'ip_address',
        'status',
        'jumlah_laporan',
    ];

    /**
     * Sembunyikan alamat IP dari serialisasi JSON/Inertia demi privasi dan keamanan.
     */
    protected $hidden = [
        'ip_address',
    ];

    protected $appends = [
        'nama_tampil',
        'waktu_relatif',
    ];

    /**
     * Relasi ke tim kepengurusan.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Accessor untuk nama pengirim (default 'Anonim' jika kosong).
     */
    protected function namaTampil(): Attribute
    {
        return Attribute::make(
            get: function () {
                $name = trim((string) $this->nama_pengirim);

                return $name !== '' ? $name : 'Anonim';
            }
        );
    }

    /**
     * Accessor untuk waktu relatif bahasa Indonesia (misal: "Baru saja", "5 menit lalu", "2 jam lalu").
     */
    protected function waktuRelatif(): Attribute
    {
        return Attribute::make(
            get: function () {
                /** @var Carbon $created */
                $created = $this->created_at ?? now();

                return $created->locale('id')->diffForHumans();
            }
        );
    }

    /**
     * Scope untuk wish yang aktif tampil di publik.
     */
    public function scopeTampil(Builder $query): Builder
    {
        return $query->where('status', 'tampil')->orderByDesc('id');
    }

    /**
     * Scope untuk wish yang dilaporkan oleh pengunjung.
     */
    public function scopeDilaporkan(Builder $query): Builder
    {
        return $query->where('jumlah_laporan', '>', 0)->orderByDesc('jumlah_laporan');
    }
}
