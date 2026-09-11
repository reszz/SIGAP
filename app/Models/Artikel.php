<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Artikel extends Model
{
    use HasFactory;

    protected $table = 'artikel';

    protected $fillable = [
        'team_id',
        'judul',
        'slug',
        'ringkasan',
        'konten',
        'gambar_sampul',
        'status',
        'ditulis_oleh',
        'diterbitkan_pada',
    ];

    protected function casts(): array
    {
        return [
            'diterbitkan_pada' => 'datetime',
        ];
    }

    /**
     * Penulis artikel (User).
     */
    public function penulis(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ditulis_oleh');
    }

    /**
     * Tim kepemilikan artikel.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'team_id');
    }

    /**
     * Scope untuk artikel yang resmi terbit dan tayang ke publik.
     */
    public function scopeTerbit(Builder $query): Builder
    {
        return $query->where('status', 'terbit')
            ->where(function (Builder $q) {
                $q->whereNull('diterbitkan_pada')
                    ->orWhere('diterbitkan_pada', '<=', now());
            })
            ->orderByRaw('COALESCE(diterbitkan_pada, created_at) DESC')
            ->orderByDesc('id');
    }

    /**
     * Auto generate slug unik dari judul artikel.
     */
    public static function generateUniqueSlug(string $judul, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($judul);
        if (empty($baseSlug)) {
            $baseSlug = 'artikel';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
