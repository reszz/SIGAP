<?php

use App\Http\Controllers\AnggaranController;
use App\Http\Controllers\AnggotaController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DivisiPanitiaController;
use App\Http\Controllers\DokumentasiController;
use App\Http\Controllers\EvaluasiController;
use App\Http\Controllers\KegiatanController;
use App\Http\Controllers\PresensiController;
use App\Http\Controllers\RiwayatSayaController;
use App\Http\Controllers\RsvpController;
use App\Http\Controllers\RundownController;
use App\Http\Controllers\SesiController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Controllers\TugasPanitiaController;
use App\Http\Middleware\EnsureTeamMembership;
use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Invitation routes (tidak butuh team prefix)
Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Route bersama (Pengurus + Anggota) ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        Route::get('kalender', [CalendarController::class, 'index'])->name('kalender.index');
        Route::get('kalender/events', [CalendarController::class, 'events'])->name('kalender.events');
        Route::get('kegiatan/{kegiatan}', [KegiatanController::class, 'show'])->name('kegiatan.show');
        Route::get('kegiatan/{kegiatan}/detail', [KegiatanController::class, 'detail'])->name('kegiatan.detail');
        Route::get('riwayat-saya', [RiwayatSayaController::class, 'index'])->name('riwayat-saya.index');

        // Dokumentasi — serve file terproteksi (semua member)
        Route::get('dokumentasi/{dokumentasi}/file', [DokumentasiController::class, 'download'])->name('dokumentasi.download');

        // Evaluasi pasca-kegiatan (FR-33-35)
        Route::post('kegiatan/{kegiatan}/evaluasi', [EvaluasiController::class, 'upsert'])->name('evaluasi.upsert');

        // Update status tugas (pemilik tugas — semua role)
        Route::patch('tugas/{tugas}/status', [TugasPanitiaController::class, 'updateStatus'])->name('tugas.updateStatus');

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
        Route::middleware(EnsureUserHasRole::class.':pengurus')->group(function () {
            Route::get('kegiatan/{kegiatan}/rsvp', [RsvpController::class, 'index'])->name('rsvp.index');
        });

        // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Prefix: pengurus/ ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
        Route::prefix('pengurus')
            ->middleware(EnsureUserHasRole::class.':pengurus')
            ->name('pengurus.')
            ->group(function () {
                Route::get('dashboard', DashboardController::class)->name('dashboard');

                // Manajemen Kegiatan (FR-05ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“FR-07)
                Route::resource('kegiatan', KegiatanController::class)
                    ->except('show')
                    ->names('kegiatan');

                // Sesi (tambah/edit/hapus per sesi dalam sebuah kegiatan)
                Route::post('kegiatan/{kegiatan}/sesi', [SesiController::class, 'store'])->name('kegiatan.sesi.store');
                Route::patch('sesi/{sesi}', [SesiController::class, 'update'])->name('sesi.update');
                Route::delete('sesi/{sesi}', [SesiController::class, 'destroy'])->name('sesi.destroy');

                // Rundown (replace seluruh rundown satu sesi)
                Route::put('sesi/{sesi}/rundown', [RundownController::class, 'upsert'])->name('sesi.rundown.upsert');

                // Rekap presensi per sesi
                Route::get('sesi/{sesi}/presensi', [PresensiController::class, 'index'])->name('sesi.presensi.index');

                // Divisi Panitia (FR-25)
                Route::post('kegiatan/{kegiatan}/divisi', [DivisiPanitiaController::class, 'store'])->name('divisi.store');
                Route::delete('divisi/{divisi}', [DivisiPanitiaController::class, 'destroy'])->name('divisi.destroy');

                // Tugas Panitia (FR-26, FR-27)
                Route::post('kegiatan/{kegiatan}/divisi/{divisi}/tugas', [TugasPanitiaController::class, 'store'])->name('tugas.store');
                Route::delete('tugas/{tugas}', [TugasPanitiaController::class, 'destroy'])->name('tugas.destroy');

                // Dokumentasi (FR-42-44)
                Route::post('kegiatan/{kegiatan}/dokumentasi', [DokumentasiController::class, 'store'])->name('dokumentasi.store');
                Route::delete('dokumentasi/{dokumentasi}', [DokumentasiController::class, 'destroy'])->name('dokumentasi.destroy');

                // Anggaran (FR-29-32)
                Route::post('kegiatan/{kegiatan}/anggaran', [AnggaranController::class, 'store'])->name('anggaran.store');
                Route::patch('anggaran/{anggaran}', [AnggaranController::class, 'update'])->name('anggaran.update');
                Route::delete('anggaran/{anggaran}', [AnggaranController::class, 'destroy'])->name('anggaran.destroy');

                // Manajemen Anggota (FR-03)
                Route::get('anggota', [AnggotaController::class, 'index'])->name('anggota.index');
                Route::post('anggota', [AnggotaController::class, 'store'])->name('anggota.store');
                Route::patch('anggota/{user}', [AnggotaController::class, 'update'])->name('anggota.update');
                Route::delete('anggota/{user}', [AnggotaController::class, 'destroy'])->name('anggota.destroy');
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
