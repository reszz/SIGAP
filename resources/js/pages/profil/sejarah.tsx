import { Clock, Milestone, BookOpen, Flag, Award, Sparkles } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

export default function Sejarah() {
    const milestones = [
        {
            year: '2018',
            title: 'Awal Mula Pendirian',
            desc: 'Organisasi dibentuk atas inisiatif para mahasiswa yang melihat perlunya wadah aspirasi independen, kolaboratif, dan dinamis untuk mengembangkan minat, bakat, serta kapasitas kepemimpinan mahasiswa di lingkungan kampus.',
        },
        {
            year: '2020',
            title: 'Adaptasi & Ekspansi Program',
            desc: 'Di tengah tantangan global, organisasi mempelopori berbagai program kerja hibrida, seminar virtual tingkat nasional, dan memperluas jaringan kemitraan dengan komunitas serta organisasi di luar kampus.',
        },
        {
            year: '2023',
            title: 'Transformasi & Tata Kelola Mandiri',
            desc: 'Penguatan kelembagaan melalui restrukturisasi divisi, standardisasi notulensi, transparansi alokasi anggaran kegiatan, serta peluncuran inisiatif pendampingan akademik bagi anggota muda.',
        },
        {
            year: '2026',
            title: 'Era Digitalisasi Melalui SIGAP',
            desc: 'Pengembangan dan implementasi penuh platform digital SIGAP untuk mengintegrasikan manajemen kegiatan, presensi kehadiran real-time, transparansi anggaran, hingga pengarsipan surat dan notulensi dalam satu atap.',
        },
    ];

    return (
        <PublicLayout
            title="Sejarah Organisasi — SIGAP"
            description="Perjalanan, tonggak sejarah, dan transformasi organisasi dari awal pendirian hingga era modern."
        >
            {/* ── Page Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#2E9E82]/30 bg-[#2E9E82]/10 px-2.5 py-1 text-xs font-medium text-[#2E9E82] dark:border-[#2E9E82]/40 dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                        <Clock className="size-3.5" />
                        <span>Kilas Balik & Perjalanan</span>
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                        Sejarah & Rekam Jejak
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                        Menelusuri jejak dedikasi, perjuangan kepengurusan lintas generasi, dan transformasi organisasi menuju era tata kelola modern.
                    </p>
                </div>
            </section>

            {/* ── Content ── */}
            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
                {/* ── Narrative Overview ── */}
                <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex items-center gap-2.5 border-b border-[rgba(30,36,48,0.06)] pb-4 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <BookOpen className="size-4" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Dedikasi Menembus Batas
                        </h2>
                    </div>

                    <div className="mt-6 space-y-4 text-xs leading-relaxed text-[#2E3542] sm:text-sm sm:leading-relaxed dark:text-[#CBD5E1]">
                        <p>
                            Organisasi ini berawal dari sebuah forum diskusi sederhana yang digagas oleh sekumpulan mahasiswa dengan semangat pembaruan. Berangkat dari kegelisahan terhadap minimnya wadah kolaboratif yang terstruktur, forum tersebut perlahan bertransformasi menjadi organisasi kemahasiswaan resmi yang mengemban mandat pengembangan kapasitas civitas akademika.
                        </p>
                        <p>
                            Dari periode ke periode, estafet kepemimpinan terus bergulir dengan tetap memegang teguh semangat kekeluargaan, independensi, dan integritas. Setiap generasi pengurus menyumbangkan gagasan baru, mulai dari penyelenggaraan kompetisi tahunan, inisiatif pengabdian kepada masyarakat, hingga advokasi hak-hak mahasiswa.
                        </p>
                        <p>
                            Kini, dengan hadirnya ekosistem digital SIGAP, organisasi melangkah ke fase baru yang lebih transparan dan efisien—memastikan setiap program kerja terlaksana dengan presisi dan setiap kontribusi anggota tercatat dengan rapi.
                        </p>
                    </div>
                </section>

                {/* ── Milestones Timeline ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                            <Milestone className="size-4" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Tonggak Perkembangan (Milestones)
                        </h2>
                    </div>

                    <div className="relative border-l-2 border-[rgba(30,36,48,0.12)] ml-4 pl-6 space-y-8 dark:border-[rgba(255,255,255,0.12)]">
                        {milestones.map((m, i) => (
                            <div key={i} className="relative group">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[31px] top-1 flex size-3.5 items-center justify-center rounded-full bg-white ring-4 ring-[#F6F7F9] dark:bg-[#0E121A] dark:ring-[#181E2B]">
                                    <div className="size-2 rounded-full bg-[#4A5FD1] group-hover:scale-125 transition" />
                                </div>

                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs transition hover:border-[#4A5FD1]/30 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {m.title}
                                        </h3>
                                        <span className="font-mono-sigap rounded-md bg-[#4A5FD1]/10 px-2 py-0.5 text-[11px] font-bold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            {m.year}
                                        </span>
                                    </div>
                                    <p className="mt-2.5 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                        {m.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
