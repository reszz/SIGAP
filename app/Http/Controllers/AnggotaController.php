<?php

namespace App\Http\Controllers;

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\AnggotaPeriode;
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
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();
        $periodeId = $user->current_periode_id;

        $query = $team->members()
            ->whereIn('users.role', ['pengurus', 'anggota']);

        if ($periodeId) {
            $query->whereHas('anggotaPeriode', function ($q) use ($periodeId) {
                $q->where('periode_id', $periodeId);
            });
        }

        $anggota = $query->with(['anggotaPeriode' => function ($q) use ($periodeId) {
            if ($periodeId) {
                $q->where('periode_id', $periodeId);
            }
        }, 'anggotaPeriode.divisiOrganisasi'])
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.nim', 'users.email', 'users.role', 'users.created_at'])
            ->map(function ($u) {
                $ap = $u->anggotaPeriode->first();

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'nim' => $u->nim,
                    'email' => $u->email,
                    'role' => $u->role instanceof GlobalRole ? $u->role->value : (string) $u->role,
                    'created_at' => $u->created_at?->toDateString(),
                    'jabatan' => $ap?->jabatan,
                    'divisi_organisasi_id' => $ap?->divisi_organisasi_id,
                    'divisi' => $ap?->divisiOrganisasi?->nama_divisi,
                    'status_periode' => $ap?->status ?? 'aktif',
                ];
            });

        $divisiList = $team->divisiOrganisasi()->get(['id', 'nama_divisi']);

        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = ! $isPeriodeEditable && ! $user->isSuperAdmin();
        $canManage = ! $isReadOnly && ($user->isSuperAdmin() || $user->isPengurus() || $user->isPembina());

        return Inertia::render('pengurus/anggota/index', [
            'anggota' => $anggota,
            'divisiList' => $divisiList,
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
        ]);
    }

    public function store(Request $request, string $currentTeam): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $currentUser = $request->user();

        // Cek izin penulisan
        if (! $currentUser->isSuperAdmin() && ! $currentUser->isPengurus() && ! $currentUser->isPembina()) {
            abort(403, 'Hanya Pengurus, Pembina, dan Super Admin yang dapat mendaftarkan anggota.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'nim' => 'required|string|max:20',
            'email' => 'required|email',
            'jabatan' => 'nullable|string|max:100',
            'divisi_organisasi_id' => 'nullable|exists:divisi_organisasi,id',
        ]);

        $periodeId = $currentUser->current_periode_id ?? $team->periodes()->where('is_aktif', true)->value('id');

        // Cari existing user berdasarkan NIM atau Email
        $existingUser = User::where('nim', $validated['nim'])
            ->orWhere('email', $validated['email'])
            ->first();

        if ($existingUser) {
            // Pastikan user terdaftar di team
            if (! $team->members()->where('user_id', $existingUser->id)->exists()) {
                $team->members()->attach($existingUser->id, ['role' => TeamRole::Member->value]);
            }

            // Jika ada periode aktif, periksa apakah sudah terdaftar di periode ini
            if ($periodeId) {
                $existingInPeriode = AnggotaPeriode::where('user_id', $existingUser->id)
                    ->where('periode_id', $periodeId)
                    ->exists();

                if ($existingInPeriode) {
                    return redirect()->back()->withErrors(['nim' => 'Anggota ini sudah terdaftar dalam periode kepengurusan ini.']);
                }

                AnggotaPeriode::create([
                    'user_id' => $existingUser->id,
                    'periode_id' => $periodeId,
                    'divisi_organisasi_id' => $validated['divisi_organisasi_id'] ?? null,
                    'jabatan' => $validated['jabatan'] ?? null,
                    'status' => 'aktif',
                ]);
            }

            return redirect()->back()->with('success', 'Anggota berhasil ditambahkan ke periode ini.');
        }

        // Jika belum ada user, buat user baru
        $user = User::create([
            'name' => $validated['name'],
            'nim' => $validated['nim'],
            'email' => $validated['email'],
            'password' => bcrypt('password'),
            'role' => 'anggota',
            'current_team_id' => $team->id,
            'current_periode_id' => $periodeId,
            'email_verified_at' => now(),
        ]);

        // Attach user ke Team sebagai Member
        $team->members()->attach($user->id, ['role' => TeamRole::Member->value]);

        if ($periodeId) {
            AnggotaPeriode::create([
                'user_id' => $user->id,
                'periode_id' => $periodeId,
                'divisi_organisasi_id' => $validated['divisi_organisasi_id'] ?? null,
                'jabatan' => $validated['jabatan'] ?? null,
                'status' => 'aktif',
            ]);
        }

        return redirect()->back()->with('success', 'Akun anggota dan keanggotaan periode berhasil dibuat.');
    }

    public function update(Request $request, string $currentTeam, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        if (! $currentUser->isSuperAdmin() && ! $currentUser->isPengurus() && ! $currentUser->isPembina()) {
            abort(403, 'Hanya Pengurus, Pembina, dan Super Admin yang dapat mengubah data anggota.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:150',
            'nim' => ['required', 'string', 'max:20', Rule::unique('users', 'nim')->ignore($user->id)],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'jabatan' => 'nullable|string|max:100',
            'divisi_organisasi_id' => 'nullable|exists:divisi_organisasi,id',
        ]);

        $user->update([
            'name' => $data['name'],
            'nim' => $data['nim'],
            'email' => $data['email'],
        ]);

        $periodeId = $currentUser->current_periode_id;
        if ($periodeId) {
            AnggotaPeriode::updateOrCreate(
                ['user_id' => $user->id, 'periode_id' => $periodeId],
                [
                    'divisi_organisasi_id' => $data['divisi_organisasi_id'] ?? null,
                    'jabatan' => $data['jabatan'] ?? null,
                ]
            );
        }

        return redirect()->back()->with('success', 'Data anggota berhasil diperbarui.');
    }

    public function updateRole(Request $request, string $currentTeam, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        if (! $currentUser->isSuperAdmin() && ! $currentUser->isPengurus() && ! $currentUser->isPembina()) {
            abort(403, 'Hanya Pengurus, Pembina, dan Super Admin yang dapat mengubah role.');
        }

        $data = $request->validate([
            'role' => ['required', 'string', 'in:pengurus,anggota'],
        ]);

        // Prevent changing the role of the current authenticated user
        abort_if(
            $user->id === $request->user()->id,
            403,
            'Kamu tidak dapat mengubah role akun kamu sendiri.',
        );

        $user->update(['role' => $data['role']]);

        return redirect()->back()->with('success', 'Role anggota berhasil diperbarui.');
    }

    public function destroy(Request $request, string $currentTeam, User $user): RedirectResponse
    {
        $currentUser = $request->user();
        if (! $currentUser->isSuperAdmin() && ! $currentUser->isPengurus() && ! $currentUser->isPembina()) {
            abort(403, 'Hanya Pengurus, Pembina, dan Super Admin yang dapat mengeluarkan anggota dari periode.');
        }

        abort_if($user->id === $currentUser->id, 403, 'Tidak dapat menghapus keanggotaan akun sendiri.');
        abort_if($user->isSuperAdmin() || ($user->isPembina() && ! $currentUser->isSuperAdmin()), 403, 'Tidak dapat mengeluarkan akun ini dari periode.');

        $periodeId = $currentUser->current_periode_id;

        abort_if(! $periodeId, 403, 'Tidak ada periode aktif yang dipilih.');

        $anggotaPeriode = AnggotaPeriode::where('user_id', $user->id)
            ->where('periode_id', $periodeId)
            ->firstOrFail();

        $anggotaPeriode->delete();

        return redirect()->back()->with('success', 'Anggota berhasil dikeluarkan dari periode ini.');
    }
}
