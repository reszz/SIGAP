<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePeriodeEditable
{
    /**
     * Handle an incoming request.
     * Prevents write actions if user is viewing an older/read-only period,
     * or if user is not registered in this period.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $isCreateOrEdit = $request->routeIs('*.create', '*.edit')
            || str_ends_with($request->path(), '/create')
            || str_ends_with($request->path(), '/edit');

        // Safe read methods are allowed EXCEPT for route actions intended for creating or editing
        if (! $isCreateOrEdit && in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        // Super Admin bypasses period edit restrictions
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $currentPeriode = $user->currentPeriode;

        // If user has a current period selected
        if ($currentPeriode) {
            // The period must be active or the latest period
            if (! $currentPeriode->is_aktif && ! $currentPeriode->isLatest()) {
                abort(403, 'Periode lampau bersifat arsip dan tidak dapat diubah (read-only).');
            }

            // User must be registered in anggota_periode for this period (except Pembina)
            if (! $user->isPembina()) {
                $isRegistered = $user->periodes()->where('periodes.id', $currentPeriode->id)->exists();
                if (! $isRegistered) {
                    abort(403, 'Anda bukan pengurus/anggota pada periode yang dipilih (akses read-only).');
                }
            }
        }

        // Pembina can only manage members and organization structure
        if ($user->isPembina()) {
            if ($request->routeIs('pengurus.anggota.*', 'pengurus.struktur-organisasi.*')) {
                return $next($request);
            }

            abort(403, 'Pembina hanya memiliki akses baca (read-only) untuk modul ini.');
        }

        return $next($request);
    }
}
