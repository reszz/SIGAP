<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user && $user->currentTeam && ! $user->current_periode_id) {
            $defaultPeriode = $user->currentTeam->periodes()->where('is_aktif', true)->first()
                ?? $user->currentTeam->periodes()->orderByDesc('tanggal_mulai')->first();
            if ($defaultPeriode) {
                $user->forceFill(['current_periode_id' => $defaultPeriode->id])->save();
                $user->load('currentPeriode');
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
            'currentPeriode' => fn () => $user?->currentPeriode ? [
                'id' => $user->currentPeriode->id,
                'team_id' => $user->currentPeriode->team_id,
                'nama' => $user->currentPeriode->nama,
                'tanggal_mulai' => $user->currentPeriode->tanggal_mulai?->format('Y-m-d'),
                'tanggal_selesai' => $user->currentPeriode->tanggal_selesai?->format('Y-m-d'),
                'is_aktif' => (bool) $user->currentPeriode->is_aktif,
                'is_latest' => $user->currentPeriode->isLatest(),
            ] : null,
            'periodes' => fn () => $user?->currentTeam
                ? $user->currentTeam->periodes()
                    ->orderByDesc('tanggal_mulai')
                    ->get()
                    ->map(fn ($p) => [
                        'id' => $p->id,
                        'team_id' => $p->team_id,
                        'nama' => $p->nama,
                        'tanggal_mulai' => $p->tanggal_mulai?->format('Y-m-d'),
                        'tanggal_selesai' => $p->tanggal_selesai?->format('Y-m-d'),
                        'is_aktif' => (bool) $p->is_aktif,
                        'is_latest' => $p->isLatest(),
                        'is_current' => $user->current_periode_id === $p->id,
                    ])
                : [],
        ];
    }
}
