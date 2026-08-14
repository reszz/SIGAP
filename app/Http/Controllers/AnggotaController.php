<?php

namespace App\Http\Controllers;

use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AnggotaController extends Controller
{
    public function index(Request $request, string $currentTeam): Response
    {
        return Inertia::render('pengurus/anggota/index', [
            'anggota' => User::where('role', 'anggota')
                ->orderBy('name')
                ->get(['id', 'name', 'nim', 'email', 'created_at']),
        ]);
    }

    public function store(Request $request, string $currentTeam): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'nim' => ['required', 'string', 'max:20', Rule::unique('users', 'nim')->whereNull('deleted_at')],
            'email' => ['required', 'email', Rule::unique('users', 'email')->whereNull('deleted_at')],
        ]);

        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $user = User::create([
            ...$data,
            'password' => bcrypt('password'),
            'role' => 'anggota',
            'current_team_id' => $team->id,
            'email_verified_at' => now(),
        ]);

        // Attach user ke Team sebagai Member
        $team->members()->attach($user->id, ['role' => TeamRole::Member->value]);

        return redirect()->back()->with('success', 'Akun anggota berhasil dibuat.');
    }

    public function update(Request $request, string $currentTeam, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:150',
            'nim' => ['required', 'string', 'max:20', Rule::unique('users', 'nim')->ignore($user->id)],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return redirect()->back()->with('success', 'Data anggota berhasil diperbarui.');
    }

    public function destroy(Request $request, string $currentTeam, User $user): RedirectResponse
    {
        abort_if($user->isPengurus(), 403, 'Tidak dapat menghapus akun Pengurus.');

        $user->delete();

        return redirect()->back()->with('success', 'Akun anggota berhasil dihapus.');
    }
}
