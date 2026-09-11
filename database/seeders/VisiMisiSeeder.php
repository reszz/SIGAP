<?php

namespace Database\Seeders;

use App\Models\Periode;
use App\Models\Team;
use App\Models\VisiMisi;
use Illuminate\Database\Seeder;

class VisiMisiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $team = Team::where('name', 'HMIF')->first();
        $periode = null;

        if ($team) {
            $periode = Periode::where('team_id', $team->id)->where('is_aktif', true)->first()
                ?? Periode::where('team_id', $team->id)->latest()->first();
        }

        if (! $periode) {
            $periode = Periode::where('is_aktif', true)->first()
                ?? Periode::latest()->first();
        }

        if (! $periode) {
            return;
        }

        $visiMisi = VisiMisi::firstOrCreate(
            ['periode_id' => $periode->id],
            [
                'visi' => 'Menjadi Himpunan Mahasiswa Teknik Informatika yang aktif dan kompetitif sebagai wadah pengembangan kompetensi, kolaborasi, serta prestasi mahasiswa di bidang teknologi dalam lingkungan yang inklusif, apresiatif, dan inovatif.',
            ]
        );

        $misiList = [
            [
                'urutan' => 1,
                'isi' => 'Menciptakan lingkungan yang suportif, inklusif, dan apresiatif bagi mahasiswa Teknik Informatika dalam pengembangan diri secara akademik dan non-akademik secara seimbang.',
            ],
            [
                'urutan' => 2,
                'isi' => 'Menyelenggarakan program kerja yang terarah dan berkelanjutan guna mengembangkan kompetensi teknis dan non-teknis mahasiswa.',
            ],
            [
                'urutan' => 3,
                'isi' => 'Membangun budaya organisasi yang profesional, demokratis, kolaboratif, dan berorientasi pada kebersamaan serta tanggung jawab.',
            ],
            [
                'urutan' => 4,
                'isi' => 'Mengoptimalkan peran himpunan sebagai fasilitator dalam mendukung partisipasi mahasiswa pada kompetisi dan kegiatan eksternal.',
            ],
        ];

        foreach ($misiList as $item) {
            $visiMisi->misiPoin()->firstOrCreate(
                [
                    'visi_misi_id' => $visiMisi->id,
                    'urutan' => $item['urutan'],
                ],
                [
                    'isi' => $item['isi'],
                ]
            );
        }
    }
}
