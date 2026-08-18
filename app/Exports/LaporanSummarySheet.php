<?php

namespace App\Exports;

use App\Models\Team;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class LaporanSummarySheet implements FromArray, WithHeadings, WithTitle
{
    public function __construct(
        private readonly Collection $data,
        private readonly Team $team,
    ) {}

    public function title(): string
    {
        return 'Ringkasan';
    }

    public function headings(): array
    {
        return [
            'Nama Kegiatan', 'Tipe', 'Total Sesi',
            'RSVP Terdaftar', 'Total Hadir', 'Kehadiran (%)',
            'Est. Anggaran (Rp)', 'Real. Anggaran (Rp)', 'Selisih (Rp)',
            'Rata-rata Rating', 'Jumlah Evaluasi',
        ];
    }

    public function array(): array
    {
        return $this->data->map(fn ($item) => [
            $item['nama'],
            $item['tipe'],
            $item['total_sesi'],
            $item['peserta_rsvp'],
            $item['total_hadir'],
            $item['persentase_hadir'],
            $item['total_estimasi'],
            $item['total_realisasi'],
            $item['selisih_anggaran'],
            $item['rata_rating'] ?? '-',
            $item['jumlah_evaluasi'],
        ])->toArray();
    }
}
