<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;

class LaporanKegiatanSheet implements FromArray, WithTitle
{
    public function __construct(private readonly array $item) {}

    public function title(): string
    {
        return mb_substr($this->item['nama'], 0, 31);
    }

    public function array(): array
    {
        $rows = [];

        // ── Info Kegiatan ──
        $rows[] = ['INFO KEGIATAN'];
        $rows[] = ['Nama', $this->item['nama']];
        $rows[] = ['Tipe', $this->item['tipe']];
        $rows[] = ['Total Sesi', $this->item['total_sesi']];
        $rows[] = [];

        // ── Sesi & Rundown ──
        $rows[] = ['JADWAL SESI & RUNDOWN'];
        $rows[] = ['Tanggal', 'Mulai', 'Selesai', 'Lokasi', 'Waktu Acara', 'Uraian Acara'];
        foreach ($this->item['sesi_detail'] as $sesi) {
            if (count($sesi['rundown']) === 0) {
                $rows[] = [$sesi['tanggal'], $sesi['waktu_mulai'], $sesi['waktu_selesai'], $sesi['lokasi'], '', ''];
            } else {
                $first = true;
                foreach ($sesi['rundown'] as $r) {
                    $rows[] = $first
                        ? [$sesi['tanggal'], $sesi['waktu_mulai'], $sesi['waktu_selesai'], $sesi['lokasi'], $r['waktu'], $r['uraian_acara']]
                        : ['', '', '', '', $r['waktu'], $r['uraian_acara']];
                    $first = false;
                }
            }
        }
        $rows[] = [];

        // ── Kehadiran ──
        $rows[] = ['DAFTAR KEHADIRAN'];
        $rows[] = ['Tanggal Sesi', 'Nama', 'NIM', 'Waktu Presensi'];
        foreach ($this->item['presensi_detail'] as $p) {
            $rows[] = [$p['sesi_tanggal'], $p['nama'], $p['nim'], $p['waktu_isi']];
        }
        $rows[] = ['', 'Total Hadir:', $this->item['total_hadir'], ''];
        $rows[] = ['', 'Persentase:', $this->item['persentase_hadir'].'%', ''];
        $rows[] = [];

        // ── Anggaran ──
        $rows[] = ['RINCIAN ANGGARAN'];
        $rows[] = ['Jenis', 'Kategori/Sumber', 'Estimasi (Rp)', 'Realisasi (Rp)', 'Selisih (Rp)'];
        foreach ($this->item['anggaran_detail'] as $a) {
            $rows[] = [$a['jenis'], $a['sumber_kategori'], $a['estimasi'], $a['realisasi'] ?? 0, $a['selisih']];
        }
        $rows[] = ['', 'Total', $this->item['total_estimasi'], $this->item['total_realisasi'], $this->item['selisih_anggaran']];
        $rows[] = [];

        // ── Evaluasi ──
        $rows[] = ['RINGKASAN EVALUASI'];
        $rows[] = ['Jumlah Evaluasi', $this->item['jumlah_evaluasi']];
        $rows[] = ['Rata-rata Rating', $this->item['rata_rating'] ?? '-'];

        return $rows;
    }
}
