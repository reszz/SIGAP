<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // EnsureSuperAdmin middleware sudah memverifikasi global_role sebelum ini

        $totalTeam = Team::count();
        $totalUser = User::count();
        $totalKegiatan = Kegiatan::count();

        // Per-team summary (top 10 by kegiatan count)
        $teams = Team::withCount(['members', 'kegiatan' => fn ($q) => $q->withoutTrashed()])
            ->orderByDesc('kegiatan_count')
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'members_count' => $t->members_count,
                'kegiatan_count' => $t->kegiatan_count,
            ]);

        // User registrasi terbaru (10)
        $userTerbaru = User::orderByDesc('created_at')
            ->limit(10)
            ->get(['id', 'name', 'email', 'global_role', 'created_at'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'global_role' => $u->global_role?->value ?? 'user',
                'created_at' => $u->created_at?->toIso8601String(),
            ]);

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => [
                'totalTeam' => $totalTeam,
                'totalUser' => $totalUser,
                'totalKegiatan' => $totalKegiatan,
            ],
            'teams' => $teams,
            'userTerbaru' => $userTerbaru,
        ]);
    }
}
