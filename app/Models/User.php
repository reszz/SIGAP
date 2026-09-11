<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Concerns\HasTeams;
use App\Enums\GlobalRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property int|null $current_team_id
 * @property int|null $current_periode_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Team|null $currentTeam
 * @property-read Periode|null $currentPeriode
 * @property-read Collection<int, Team> $ownedTeams
 * @property-read Collection<int, Membership> $teamMemberships
 * @property-read Collection<int, Team> $teams
 */
#[Fillable(['name', 'nim', 'email', 'password', 'role', 'current_team_id', 'current_periode_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasTeams, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => GlobalRole::class,
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === GlobalRole::SuperAdmin || $this->role === 'super_admin';
    }

    public function isPembina(): bool
    {
        return $this->role === GlobalRole::Pembina || $this->role === 'pembina';
    }

    public function isPengurus(): bool
    {
        return $this->role === GlobalRole::Pengurus || $this->role === 'pengurus';
    }

    public function isAnggota(): bool
    {
        return $this->role === GlobalRole::Anggota || $this->role === 'anggota';
    }

    public function isAnggotaHmif(): bool
    {
        return $this->isPengurus() || $this->isAnggota();
    }

    public function currentPeriode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'current_periode_id');
    }

    public function anggotaPeriode(): HasMany
    {
        return $this->hasMany(AnggotaPeriode::class, 'user_id');
    }

    public function periodes(): BelongsToMany
    {
        return $this->belongsToMany(Periode::class, 'anggota_periode', 'user_id', 'periode_id')
            ->withPivot(['divisi_organisasi_id', 'jabatan', 'status'])
            ->withTimestamps();
    }

    public function switchPeriode(Periode $periode): void
    {
        $this->forceFill(['current_periode_id' => $periode->id])->save();
    }

    public function kepanitiaan(): HasMany
    {
        return $this->hasMany(Kepanitiaan::class);
    }

    /**
     * Tugas yang menjadi tanggung jawab user ini (sebagai PIC).
     */
    public function tugas(): HasMany
    {
        return $this->hasMany(Tugas::class, 'pic_user_id');
    }

    public function rsvp(): HasMany
    {
        return $this->hasMany(Rsvp::class);
    }

    public function presensi(): HasMany
    {
        return $this->hasMany(Presensi::class);
    }

    public function evaluasi(): HasMany
    {
        return $this->hasMany(Evaluasi::class);
    }

    public function dokumentasi(): HasMany
    {
        return $this->hasMany(Dokumentasi::class, 'uploaded_by');
    }
}
