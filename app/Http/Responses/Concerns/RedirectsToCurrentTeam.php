<?php

namespace App\Http\Responses\Concerns;

use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

trait RedirectsToCurrentTeam
{
    protected function redirectPathForCurrentTeam(Request $request, string $redirect): string
    {
        $team = $this->currentTeam($request);
        $user = $request->user();

        URL::defaults(['current_team' => $team->slug]);

        // Arahkan ke dashboard sesuai role, abaikan $redirect bawaan Fortify
        $rolePath = $user?->isPengurus() ? 'pengurus' : 'anggota';

        return "/{$team->slug}/{$rolePath}/dashboard";
    }

    protected function currentTeam(Request $request): Team
    {
        $user = $request->user();

        abort_if(! $user, 403);

        $team = $user->currentTeam ?? $user->personalTeam();

        abort_if(! $team, 403);

        return $team;
    }
}
