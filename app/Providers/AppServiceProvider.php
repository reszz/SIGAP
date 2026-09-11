<?php

namespace App\Providers;

use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Periode;
use App\Models\Tugas;
use App\Models\VisiMisi;
use App\Policies\AnggaranPolicy;
use App\Policies\DokumentasiPolicy;
use App\Policies\KegiatanPolicy;
use App\Policies\KepanitiaanPolicy;
use App\Policies\PeriodePolicy;
use App\Policies\RundownPolicy;
use App\Policies\SuratPolicy;
use App\Policies\TugasPolicy;
use App\Policies\VisiMisiPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->registerPolicies();
        $this->registerGateAbilities();

        // Super Admin bypasses all authorization checks across all gates and policies
        // KECUALI untuk Visi & Misi di mana Super Admin tetap harus tunduk pada aturan read-only periode aktif
        Gate::before(function ($user, string $ability, array $arguments = []) {
            if (isset($arguments[0]) && ($arguments[0] === VisiMisi::class || $arguments[0] instanceof VisiMisi)) {
                return null;
            }

            if ($user && method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
                return true;
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Daftarkan Policy untuk model Eloquent (Layer 2–4 otorisasi per-resource).
     */
    protected function registerPolicies(): void
    {
        // KegiatanPolicy: $this->authorize('manage', $kegiatan)
        Gate::policy(Kegiatan::class, KegiatanPolicy::class);

        Gate::policy(Kepanitiaan::class, KepanitiaanPolicy::class);

        // TugasPolicy: $this->authorize('updateStatus', $tugas)
        Gate::policy(Tugas::class, TugasPolicy::class);

        // PeriodePolicy: $this->authorize('create', Periode::class)
        Gate::policy(Periode::class, PeriodePolicy::class);

        // VisiMisiPolicy: Gate::authorize('manage', [VisiMisi::class, $periode])
        Gate::policy(VisiMisi::class, VisiMisiPolicy::class);
    }

    /**
     * Daftarkan Gate abilities untuk modul yang konteks otorisasinya adalah
     * Kegiatan (bukan model resource individual) — pakai Gate::define()
     * sesuai keputusan desain. Dipanggil via:
     *
     *   Gate::allows('anggaran.manage', $kegiatan)
     *   $this->authorize('anggaran.manage', $kegiatan)
     *
     * Semua abilities ini menerima (User $user, Kegiatan $kegiatan).
     */
    protected function registerGateAbilities(): void
    {
        // ─── Anggaran (SRS §3.8) ──────────────────────────────────────────────
        Gate::define('anggaran.manage', [AnggaranPolicy::class, 'manage']);
        Gate::define('anggaran.manage-logistik', [AnggaranPolicy::class, 'manageLogistik']);

        // ─── Dokumentasi (SRS §3.10) ──────────────────────────────────────────
        Gate::define('dokumentasi.upload-foto', [DokumentasiPolicy::class, 'uploadFoto']);
        Gate::define('dokumentasi.upload-notulen', [DokumentasiPolicy::class, 'uploadNotulen']);

        // ─── Surat Menyurat (SRS §3.11) ───────────────────────────────────────
        Gate::define('surat.manage', [SuratPolicy::class, 'manageSurat']);
        Gate::define('surat.manage-keluar', [SuratPolicy::class, 'manageSuratKeluar']);

        // ─── Rundown (SRS §3.2 FR-10) ─────────────────────────────────────────
        Gate::define('rundown.manage', [RundownPolicy::class, 'manage']);

        // ─── Kepanitiaan via Gate::define juga (untuk konteks tanpa model) ────
        Gate::define('kepanitiaan.manage', [KepanitiaanPolicy::class, 'manage']);
        Gate::define('kepanitiaan.manageAnggotaDivisi', [KepanitiaanPolicy::class, 'manageAnggotaDivisi']);
        Gate::define('kepanitiaan.setKoordinator', [KepanitiaanPolicy::class, 'setKoordinator']);

        // ─── Periode ──────────────────────────────────────────────────────────
        Gate::define('periode.create', [PeriodePolicy::class, 'create']);
    }
}
