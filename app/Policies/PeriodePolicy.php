<?php

namespace App\Policies;

use App\Models\Periode;
use App\Models\User;

class PeriodePolicy
{
    /**
     * Determine whether the user can view any periodes.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the specific periode.
     */
    public function view(User $user, Periode $periode): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->belongsToTeam($periode->team);
    }

    /**
     * Determine whether the user can create a periode.
     * Hanya super_admin dan pembina yang dapat membuat periode.
     */
    public function create(User $user): bool
    {
        return $user->isSuperAdmin() || $user->isPembina();
    }

    /**
     * Determine whether the user can update a periode.
     */
    public function update(User $user, Periode $periode): bool
    {
        return $user->isSuperAdmin() || $user->isPembina();
    }

    /**
     * Determine whether the user can delete a periode.
     */
    public function delete(User $user, Periode $periode): bool
    {
        return $user->isSuperAdmin() || $user->isPembina();
    }
}
