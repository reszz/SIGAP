<?php

namespace App\Http\Controllers;

use App\Models\Artikel;
use App\Models\PengurusStruktur;
use App\Models\Team;
use App\Models\Wish;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicHomeController extends Controller
{
    /**
     * Tampilkan halaman Beranda publik SIGAP dengan data dinamis dari modul:
     * - Artikel & Berita terbaru (status = terbit)
     * - Preview pengurus inti (pucuk pimpinan tanpa divisi)
     * - Teaser pesan Wish Wall (status = tampil)
     */
    public function __invoke(Request $request): Response
    {
        // ── 1. Team Utama Organisasi ──
        $team = Team::where('is_personal', false)->orderBy('id')->first();

        // ── 2. Artikel Terbaru (Maksimal 3 terbit) ──
        $artikelTerbaru = Artikel::terbit()
            ->with(['penulis:id,name'])
            ->take(3)
            ->get()
            ->map(fn (Artikel $a): array => [
                'id' => $a->id,
                'judul' => $a->judul,
                'slug' => $a->slug,
                'ringkasan' => $a->ringkasan,
                'gambar_sampul' => $a->gambar_sampul,
                'diterbitkan_pada' => $a->diterbitkan_pada?->toDateString() ?? $a->created_at->toDateString(),
                'penulis' => $a->penulis ? ['name' => $a->penulis->name] : null,
            ]);

        // ── 3. Pengurus Inti Periode Aktif ──
        $pengurusInti = collect();
        if ($team) {
            $latestPeriode = PengurusStruktur::where('team_id', $team->id)->max('periode') ?? date('Y');

            $pengurusInti = PengurusStruktur::where('team_id', $team->id)
                ->where('periode', $latestPeriode)
                ->whereNull('divisi_organisasi_id')
                ->orderBy('urutan_tampil')
                ->take(4)
                ->get()
                ->map(fn (PengurusStruktur $p): array => [
                    'id' => $p->id,
                    'nama' => $p->nama,
                    'jabatan' => $p->jabatan,
                    'foto_path' => $p->foto_path,
                    'periode' => $p->periode,
                ]);
        }

        // ── 4. Teaser Wish Wall (Maksimal 3 tampil) ──
        $wishesTerbaru = Wish::tampil()
            ->take(3)
            ->get()
            ->map(fn (Wish $w): array => [
                'id' => $w->id,
                'nama_tampil' => $w->nama_tampil,
                'pesan' => $w->pesan,
                'waktu_relatif' => $w->waktu_relatif,
            ]);

        return Inertia::render('welcome', [
            'artikelTerbaru' => $artikelTerbaru,
            'pengurusInti' => $pengurusInti,
            'wishesTerbaru' => $wishesTerbaru,
        ]);
    }
}
