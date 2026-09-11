<?php

namespace App\Http\Middleware;

use App\Enums\GlobalRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     * Supports multiple roles (comma separated or multiple parameters).
     * Super Admin always passes.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthorized action.');
        }

        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $flattenedRoles = [];
        foreach ($roles as $role) {
            foreach (explode(',', $role) as $r) {
                $trimmed = trim($r);
                if ($trimmed !== '') {
                    $flattenedRoles[] = $trimmed;
                }
            }
        }

        $userRoleValue = $user->role instanceof GlobalRole ? $user->role->value : (string) $user->role;

        if (! in_array($userRoleValue, $flattenedRoles, true)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
