<?php

namespace App\Enums;

enum GlobalRole: string
{
    case SuperAdmin = 'super_admin';
    case Pembina = 'pembina';
    case Pengurus = 'pengurus';
    case Anggota = 'anggota';

    /**
     * Get the human-readable label for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Pembina => 'Pembina',
            self::Pengurus => 'Pengurus',
            self::Anggota => 'Anggota',
        };
    }

    /**
     * Check whether this role is part of internal HMIF student members (pengurus / anggota).
     */
    public function isAnggotaHmif(): bool
    {
        return in_array($this, [self::Pengurus, self::Anggota]);
    }

    /**
     * Check whether this role can create new periodes.
     */
    public function canCreatePeriode(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Pembina]);
    }

    /**
     * Check whether this role can perform administrative write actions on activities/budget/etc.
     */
    public function canWrite(): bool
    {
        return in_array($this, [self::SuperAdmin, self::Pengurus]);
    }
}
