<?php

use App\Http\Controllers\AnggaranController;
use App\Http\Controllers\AnggaranIndexController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisiController;
use App\Http\Controllers\DokumentasiController;
use App\Http\Controllers\DokumentasiIndexController;
use App\Http\Controllers\EvaluasiController;
use App\Http\Controllers\EvaluasiIndexController;
use App\Http\Controllers\KegiatanController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\PanitiaIndexController;
use App\Http\Controllers\Pengurus\ArtikelController;
use App\Http\Controllers\Pengurus\StrukturOrganisasiController;
use App\Http\Controllers\Pengurus\VisiMisiController;
use App\Http\Controllers\Pengurus\WishWallController;
use App\Http\Controllers\PeriodeController;
use App\Http\Controllers\PresensiController;
use App\Http\Controllers\PublicBlogController;
use App\Http\Controllers\PublicCalendarController;
use App\Http\Controllers\PublicDivisiController;
use App\Http\Controllers\PublicHomeController;
use App\Http\Controllers\PublicStrukturController;
use App\Http\Controllers\PublicVisiMisiController;
use App\Http\Controllers\PublicWishWallController;
use App\Http\Controllers\RiwayatSayaController;
use App\Http\Controllers\RsvpController;
use App\Http\Controllers\RundownController;
use App\Http\Controllers\RundownIndexController;
use App\Http\Controllers\SesiController;
use App\Http\Controllers\SuperAdmin\DashboardController as SuperAdminDashboard;
use App\Http\Controllers\SuratController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\TugasController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', PublicHomeController::class)->name('home');

// Halaman Publik (Tanpa Auth)
Route::get('kalender', PublicCalendarController::class)->name('kalender.publik');
Route::get('profil/visi-misi', PublicVisiMisiController::class)->name('profil.visi-misi');
Route::inertia('profil/sejarah', 'profil/sejarah')->name('profil.sejarah');
Route::inertia('privacy-policy', 'privacy-policy')->name('privacy-policy');

// Halaman publik keorganisasian (aktif)
Route::get('keorganisasian/struktur', PublicStrukturController::class)->name('keorganisasian.struktur');
Route::get('keorganisasian/divisi', PublicDivisiController::class)->name('keorganisasian.divisi');

// Halaman Publik Blog / Berita
Route::get('blog', [PublicBlogController::class, 'index'])->name('blog.index');
Route::get('blog/{slug}', [PublicBlogController::class, 'show'])->name('blog.show');

// Halaman Publik Wish Wall (Papan Pesan Publik)
Route::get('wish-wall', [PublicWishWallController::class, 'index'])->name('wish-wall.index');
Route::post('wish-wall', [PublicWishWallController::class, 'store'])->name('wish-wall.store');
Route::post('wish-wall/{wish}/report', [PublicWishWallController::class, 'report'])->name('wish-wall.report');

// Generic /dashboard redirect — mempertahankan route('dashboard') untuk Fortify dan test lama
Route::middleware(['auth', 'verified'])->get('/dashboard', function (Request $request) {
    $user = $request->user();
    if ($user->isSuperAdmin()) {
        return redirect()->route('super-admin.dashboard');
    }

    $team = $user->currentTeam;
    if (! $team) {
        return redirect()->route('teams.create');
    }
    if ($user->isPengurus() || $user->isPembina()) {
        return redirect()->route('pengurus.dashboard', $team->slug);
    }

    return redirect()->route('anggota.dashboard', $team->slug);
})->name('dashboard');

// Invitation routes (tidak butuh team prefix)
Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

// Super Admin (global_role = super_admin)
Route::middleware(['auth', 'verified', 'super_admin'])
    ->prefix('super-admin')
    ->name('super-admin.')
    ->group(function () {
        Route::get('dashboard', SuperAdminDashboard::class)->name('dashboard');
    });

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Route bersama (Pengurus + Anggota) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        Route::get('kalender', [CalendarController::class, 'index'])->name('kalender.index');
        Route::get('kalender/events', [CalendarController::class, 'events'])->name('kalender.events');
        Route::get('kegiatan/{kegiatan}', [KegiatanController::class, 'show'])->name('kegiatan.show');
        Route::get('riwayat-saya', [RiwayatSayaController::class, 'index'])->name('riwayat-saya.index');

        // Dokumentasi — serve file terproteksi (semua member)
        Route::get('dokumentasi/{dokumentasi}/file', [DokumentasiController::class, 'download'])->name('dokumentasi.download');

        // Halaman Panitia — shared (Ketua Pelaksana yang role=anggota harus bisa akses)
        Route::get('panitia', [PanitiaIndexController::class, 'index'])->name('panitia.index');

        // Halaman proses terpisah — shared (jabatan Kepanitiaan juga butuh akses)
        Route::get('rundown', [RundownIndexController::class, 'index'])->name('rundown.index');
        Route::get('anggaran', [AnggaranIndexController::class, 'index'])->name('anggaran.index');
        Route::get('dokumentasi', [DokumentasiIndexController::class, 'index'])->name('dokumentasi.index');
        Route::get('evaluasi', [EvaluasiIndexController::class, 'index'])->name('evaluasi.index');

        // Evaluasi pasca-kegiatan (FR-33-35)
        Route::post('kegiatan/{kegiatan}/evaluasi', [EvaluasiController::class, 'upsert'])->name('evaluasi.upsert');
        Route::patch('tugas/{tugas}/status', [TugasController::class, 'updateStatus'])->name('tugas.update-status');

        // Tugas CRUD — otorisasi via TugasPolicy::manage() per FR-31
        // Di shared group karena anggota Divisi (bukan pengurus) juga boleh akses
        Route::post('kegiatan/{kegiatan}/tugas', [TugasController::class, 'store'])->name('tugas.store');
        Route::patch('tugas/{tugas}', [TugasController::class, 'update'])->name('tugas.update');
        Route::delete('tugas/{tugas}', [TugasController::class, 'destroy'])->name('tugas.destroy');

        // [Wave berikutnya] Routes Kepanitiaan & Tugas akan ditambahkan di sini

        // Kepanitiaan mutasi — shared (Ketua Pelaksana yang role=anggota harus bisa akses)
        // Otorisasi dikontrol sepenuhnya oleh KepanitiaanPolicy::manage()
        Route::get('kegiatan/{kegiatan}/divisi', [DivisiController::class, 'index'])->name('divisi.index');
        Route::post('kegiatan/{kegiatan}/divisi', [DivisiController::class, 'store'])->name('divisi.store');
        Route::patch('divisi/{kepanitiaan}', [DivisiController::class, 'update'])->name('divisi.update');
        Route::delete('divisi/{kepanitiaan}', [DivisiController::class, 'destroy'])->name('divisi.destroy');
        Route::patch('divisi/{kepanitiaan}/koordinator', [DivisiController::class, 'toggleKoordinator'])->name('divisi.koordinator');

        // Rundown upsert — shared (Div Acara yang role=anggota harus bisa akses)
        // Otorisasi dikontrol oleh RundownPolicy::manage()
        Route::put('sesi/{sesi}/rundown', [RundownController::class, 'upsert'])->name('sesi.rundown.upsert');

        // Rekap presensi — shared (Ketua Pelaksana harus bisa lihat)
        Route::get('sesi/{sesi}/presensi', [PresensiController::class, 'index'])->name('sesi.presensi.index');

        // Dokumentasi mutasi — shared (Sekretaris/Div PDD yang role=anggota harus bisa akses)
        // Otorisasi dikontrol oleh DokumentasiPolicy::uploadFoto / uploadNotulen
        Route::post('kegiatan/{kegiatan}/dokumentasi', [DokumentasiController::class, 'store'])->name('dokumentasi.store');
        Route::delete('dokumentasi/{dokumentasi}', [DokumentasiController::class, 'destroy'])->name('dokumentasi.destroy');

        // Anggaran mutasi — shared (Bendahara/Div Logistik yang role=anggota harus bisa akses)
        // Otorisasi dikontrol oleh AnggaranPolicy::manage / manageLogistik
        Route::post('kegiatan/{kegiatan}/anggaran', [AnggaranController::class, 'store'])->name('anggaran.store');
        Route::patch('anggaran/{anggaran}', [AnggaranController::class, 'update'])->name('anggaran.update');
        Route::delete('anggaran/{anggaran}', [AnggaranController::class, 'destroy'])->name('anggaran.destroy');

        // Surat Menyurat (FR-45/FR-46/FR-48)
        // Di luar prefix /pengurus/ agar Anggota dengan jabatan Sekretaris/Div Humas bisa akses.
        // Otorisasi per-tipe dilakukan di SuratController via SuratPolicy.
        Route::get('surat', [SuratController::class, 'index'])->name('surat.index');
        Route::post('surat/{kegiatan}', [SuratController::class, 'store'])->name('surat.store');
        Route::patch('surat/{surat}', [SuratController::class, 'update'])->name('surat.update');
        Route::delete('surat/{surat}', [SuratController::class, 'destroy'])->name('surat.destroy');
        Route::get('surat/{surat}/file', [SuratController::class, 'download'])->name('surat.download');

        // Presensi ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â bisa diakses kedua role (anggota yang submit, tapi middleware auth sudah ada)
        Route::get('presensi/{kode}', [PresensiController::class, 'show'])->name('presensi.show');
        Route::post('presensi/{kode}', [PresensiController::class, 'store'])->name('presensi.store');

        // RSVP sisi Anggota
        Route::middleware(EnsureUserHasRole::class.':anggota')->group(function () {
            Route::get('kegiatan/{kegiatan}/rsvp/status', [RsvpController::class, 'status'])->name('rsvp.status');
            Route::post('kegiatan/{kegiatan}/rsvp', [RsvpController::class, 'store'])->name('rsvp.store');
            Route::delete('kegiatan/{kegiatan}/rsvp', [RsvpController::class, 'destroy'])->name('rsvp.destroy');
        });

        // RSVP sisi Pengurus (read-only daftar peserta)
        Route::middleware(EnsureUserHasRole::class.':pengurus,pembina')->group(function () {
            Route::get('kegiatan/{kegiatan}/rsvp', [RsvpController::class, 'index'])->name('rsvp.index');
        });

        // Periode Management & Switcher
        Route::post('periodes', [PeriodeController::class, 'store'])->name('periodes.store');
        Route::patch('switch-periode/{periode}', [PeriodeController::class, 'switch'])->name('periodes.switch');

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Prefix: pengurus/ ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        Route::prefix('pengurus')
            ->middleware([EnsureUserHasRole::class.':pengurus,pembina', 'periode.editable'])
            ->name('pengurus.')
            ->group(function () {
                Route::get('dashboard', DashboardController::class)->name('dashboard');

                // Laporan (FR-39-40)
                Route::get('laporan', [LaporanController::class, 'index'])->name('laporan.index');
                Route::get('laporan/preview', [LaporanController::class, 'preview'])->name('laporan.preview');
                Route::get('laporan/excel', [LaporanController::class, 'exportExcel'])->name('laporan.excel');
                Route::get('laporan/pdf', [LaporanController::class, 'exportPdf'])->name('laporan.pdf');

                // Manajemen Kegiatan (FR-05ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“FR-07)
                Route::resource('kegiatan', KegiatanController::class)
                    ->except('show')
                    ->names('kegiatan');

                // Sesi (tambah/edit/hapus per sesi dalam sebuah kegiatan)
                Route::post('kegiatan/{kegiatan}/sesi', [SesiController::class, 'store'])->name('kegiatan.sesi.store');
                Route::patch('sesi/{sesi}', [SesiController::class, 'update'])->name('sesi.update');
                Route::delete('sesi/{sesi}', [SesiController::class, 'destroy'])->name('sesi.destroy');

                // Manajemen Anggota (FR-03)
                Route::get('anggota', [AnggotaController::class, 'index'])->name('anggota.index');
                Route::post('anggota', [AnggotaController::class, 'store'])->name('anggota.store');
                Route::patch('anggota/{user}', [AnggotaController::class, 'update'])->name('anggota.update');
                Route::patch('anggota/{user}/role', [AnggotaController::class, 'updateRole'])->name('anggota.update-role');
                Route::delete('anggota/{user}', [AnggotaController::class, 'destroy'])->name('anggota.destroy');

                // Struktur Organisasi Permanen (terpisah dari kepanitiaan per-kegiatan)
                Route::get('struktur-organisasi', [StrukturOrganisasiController::class, 'index'])->name('struktur-organisasi.index');
                Route::post('struktur-organisasi/divisi', [StrukturOrganisasiController::class, 'storeDivisi'])->name('struktur-organisasi.divisi.store');
                Route::patch('struktur-organisasi/divisi/{divisi}', [StrukturOrganisasiController::class, 'updateDivisi'])->name('struktur-organisasi.divisi.update');
                Route::delete('struktur-organisasi/divisi/{divisi}', [StrukturOrganisasiController::class, 'destroyDivisi'])->name('struktur-organisasi.divisi.destroy');
                Route::post('struktur-organisasi/pengurus', [StrukturOrganisasiController::class, 'storePengurus'])->name('struktur-organisasi.pengurus.store');
                Route::post('struktur-organisasi/pengurus/{pengurus}', [StrukturOrganisasiController::class, 'updatePengurus'])->name('struktur-organisasi.pengurus.update');
                Route::delete('struktur-organisasi/pengurus/{pengurus}', [StrukturOrganisasiController::class, 'destroyPengurus'])->name('struktur-organisasi.pengurus.destroy');

                // Kelola Artikel / Blog
                Route::resource('artikel', ArtikelController::class)->names('artikel');

                // Moderasi Wish Wall
                Route::get('wish-wall', [WishWallController::class, 'index'])->name('wish-wall.index');
                Route::patch('wish-wall/{wish}/toggle-status', [WishWallController::class, 'toggleStatus'])->name('wish-wall.toggle-status');
                Route::delete('wish-wall/{wish}', [WishWallController::class, 'destroy'])->name('wish-wall.destroy');

                // Kelola Visi & Misi
                Route::get('visi-misi', [VisiMisiController::class, 'index'])->name('visi-misi.index');
                Route::put('visi-misi', [VisiMisiController::class, 'updateVisi'])->name('visi-misi.update-visi');
                Route::post('visi-misi/misi', [VisiMisiController::class, 'storeMisi'])->name('visi-misi.misi.store');
                Route::patch('visi-misi/misi/{misiPoin}', [VisiMisiController::class, 'updateMisi'])->name('visi-misi.misi.update');
                Route::delete('visi-misi/misi/{misiPoin}', [VisiMisiController::class, 'destroyMisi'])->name('visi-misi.misi.destroy');
                Route::post('visi-misi/misi/reorder', [VisiMisiController::class, 'reorderMisi'])->name('visi-misi.misi.reorder');
            });

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Prefix: anggota/ ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        Route::prefix('anggota')
            ->middleware(EnsureUserHasRole::class.':anggota')
            ->name('anggota.')
            ->group(function () {
                Route::get('dashboard', DashboardController::class)->name('dashboard');
            });
    });

require __DIR__.'/settings.php';
