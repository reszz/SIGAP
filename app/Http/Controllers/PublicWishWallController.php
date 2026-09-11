<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\Wish;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class PublicWishWallController extends Controller
{
    /**
     * Tampilkan halaman publik Wish Wall beserta daftar pesan yang berstatus 'tampil'.
     */
    public function index(Request $request): Response
    {
        $wishes = Wish::tampil()
            ->paginate(15)
            ->withQueryString();

        $totalWishes = Wish::where('status', 'tampil')->count();

        return Inertia::render('wish-wall/index', [
            'wishes' => $wishes,
            'totalWishes' => $totalWishes,
        ]);
    }

    /**
     * Kirim pesan baru ke Wish Wall dengan proteksi Honeypot & Rate Limiting.
     */
    public function store(Request $request): RedirectResponse
    {
        // ── 1. Honeypot Anti-Bot Check ──
        // Field `website_url` disembunyikan via CSS offscreen. Manusia tidak akan mengisinya,
        // sedangkan bot spam otomatis mengisinya. Jika terisi, tolak diam-diam (silent reject).
        if (! empty($request->input('website_url'))) {
            return back()->with('success', 'Pesan dan harapan Anda berhasil dipublikasikan!');
        }

        // ── 2. Rate Limiting Protection (Maks 3 pesan / 10 menit per IP) ──
        $ip = $request->ip() ?? '127.0.0.1';
        $rateLimitKey = 'wish_wall_submit:'.$ip;

        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            $minutes = max(1, (int) ceil($seconds / 60));

            return back()
                ->withErrors([
                    'pesan' => "Terlalu banyak pesan terkirim dari perangkat Anda. Silakan coba lagi dalam {$minutes} menit.",
                ])
                ->withInput();
        }

        // ── 3. Validasi Payload ──
        $validated = $request->validate([
            'pesan' => ['required', 'string', 'min:3', 'max:500'],
            'nama_pengirim' => ['nullable', 'string', 'max:80'],
        ], [
            'pesan.required' => 'Pesan harapan tidak boleh kosong.',
            'pesan.min' => 'Pesan terlalu pendek (minimal 3 karakter).',
            'pesan.max' => 'Pesan tidak boleh melebihi 500 karakter.',
            'nama_pengirim.max' => 'Nama pengirim tidak boleh melebihi 80 karakter.',
        ]);

        // Catat hit rate limiter (decay 10 menit / 600 detik)
        RateLimiter::hit($rateLimitKey, 600);

        // Ambil team organisasi utama
        $team = Team::where('is_personal', false)->orderBy('id')->first();

        // ── 4. Simpan ke Database ──
        Wish::create([
            'team_id' => $team?->id,
            'nama_pengirim' => ! empty($validated['nama_pengirim']) ? trim($validated['nama_pengirim']) : null,
            'pesan' => trim($validated['pesan']),
            'ip_address' => $ip,
            'status' => 'tampil',
            'jumlah_laporan' => 0,
        ]);

        return back()->with('success', 'Pesan dan harapan Anda berhasil dipublikasikan!');
    }

    /**
     * Laporkan pesan yang tidak pantas (Auto-Hide cerdas setelah 3 laporan).
     */
    public function report(Request $request, Wish $wish): RedirectResponse
    {
        $ip = $request->ip() ?? '127.0.0.1';
        $reportKey = 'wish_wall_report:'.$wish->id.':'.$ip;

        // Cegah spam laporan dari IP yang sama untuk wish yang sama (1 hari cooldown)
        if (RateLimiter::tooManyAttempts($reportKey, 1)) {
            return back()->with('info', 'Anda sudah melaporkan pesan ini sebelumnya.');
        }

        RateLimiter::hit($reportKey, 86400);

        $wish->increment('jumlah_laporan');

        // Jika jumlah laporan mencapai ambang batas (>= 3), otomatis sembunyikan untuk moderasi pengurus
        if ($wish->jumlah_laporan >= 3 && $wish->status === 'tampil') {
            $wish->update(['status' => 'disembunyikan']);
        }

        return back()->with('success', 'Terima kasih, laporan Anda telah diterima dan akan ditinjau oleh pengurus.');
    }
}
