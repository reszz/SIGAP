import {
    Target,
    Compass,
    CheckCircle2,
    Shield,
    HeartHandshake,
    Zap,
    Users,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

interface MisiItem {
    id: number;
    isi: string;
    urutan: number;
}

interface PeriodeInfo {
    id: number;
    nama: string;
    is_aktif: boolean;
}

interface VisiMisiData {
    id: number;
    visi: string;
    periode?: PeriodeInfo | null;
    misi: MisiItem[];
}

interface Props {
    visiMisi?: VisiMisiData | null;
}

export default function VisiMisi({ visiMisi }: Props) {
    const values = [
        {
            icon: HeartHandshake,
            title: 'Inklusif & Apresiatif',
            desc: 'Menghadirkan lingkungan yang suportif dan apresiatif bagi setiap mahasiswa Teknik Informatika untuk berkembang secara akademik maupun non-akademik.',
        },
        {
            icon: Zap,
            title: 'Kompetitif & Berprestasi',
            desc: 'Mendorong pengembangan kompetensi teknis dan non-teknis yang terarah, serta partisipasi aktif dalam kompetisi dan kegiatan eksternal.',
        },
        {
            icon: Users,
            title: 'Kolaboratif & Demokratis',
            desc: 'Membangun budaya organisasi yang kolaboratif dan demokratis, berorientasi pada kebersamaan lintas divisi dan anggota.',
        },
        {
            icon: Shield,
            title: 'Profesional & Bertanggung Jawab',
            desc: 'Menjalankan setiap program kerja dan amanah kepengurusan secara profesional, konsisten, dan penuh tanggung jawab.',
        },
    ];

    const misiList = visiMisi?.misi ?? [];

    return (
        <PublicLayout
            title="Visi & Misi — HMIF"
            description="Visi, misi, dan nilai-nilai dasar Himpunan Mahasiswa Teknik Informatika dalam menggerakkan program kerja kemahasiswaan."
        >
            {/* ── Page Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#4A5FD1]/30 bg-[#4A5FD1]/10 px-2.5 py-1 text-xs font-medium text-[#4A5FD1] dark:border-[#4A5FD1]/40 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                        <Compass className="size-3.5" />
                        <span>
                            {visiMisi?.periode
                                ? `Arah & Tujuan Organisasi Periode ${visiMisi.periode.nama}`
                                : 'Arah & Tujuan Organisasi'}
                        </span>
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                        Visi & Misi HMIF
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                        Landasan fundamental yang memandu setiap langkah,
                        inisiatif kegiatan, dan pengabdian kepengurusan Himpunan
                        Mahasiswa Teknik Informatika.
                    </p>
                </div>
            </section>

            {/* ── Main Content ── */}
            <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
                {/* ── Visi Section ── */}
                <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-xs sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex items-center gap-2.5 border-b border-[rgba(30,36,48,0.06)] pb-4 dark:border-[rgba(255,255,255,0.06)]">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <Target className="size-4" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Visi Utama
                        </h2>
                    </div>

                    <div className="mt-6">
                        {visiMisi?.visi ? (
                            <p className="font-display text-base leading-relaxed font-medium text-[#1E2430] sm:text-lg dark:text-[#E6ECF5]">
                                &ldquo;{visiMisi.visi}&rdquo;
                            </p>
                        ) : (
                            <p className="text-sm text-[#727C8E] italic dark:text-[#8C97A8]">
                                Visi organisasi belum ditentukan untuk periode
                                ini.
                            </p>
                        )}
                    </div>
                </section>

                {/* ── Misi Section ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                            <CheckCircle2 className="size-4" />
                        </div>
                        <h2 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Misi Strategis
                        </h2>
                    </div>

                    {misiList.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {misiList.map((m, index) => (
                                <div
                                    key={m.id || index}
                                    className="flex flex-col justify-between rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs transition hover:border-[#4A5FD1]/30 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                >
                                    <div>
                                        <span className="font-mono-sigap text-xs font-bold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                            {String(
                                                m.urutan || index + 1,
                                            ).padStart(2, '0')}
                                        </span>
                                        <p className="mt-3 text-xs leading-relaxed text-[#1E2430] sm:text-sm dark:text-[#E6ECF5]">
                                            {m.isi}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-[rgba(30,36,48,0.15)] p-8 text-center text-sm text-[#727C8E] dark:border-[rgba(255,255,255,0.15)] dark:text-[#8C97A8]">
                            Poin-poin misi belum ditambahkan untuk periode ini.
                        </div>
                    )}
                </section>

                {/* ── Nilai Nilai Dasar ── */}
                <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-xs sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="mb-6">
                        <h2 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Nilai-Nilai Dasar (Core Values)
                        </h2>
                        <p className="mt-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Nilai yang diturunkan langsung dari visi & misi,
                            dihidupkan oleh setiap anggota HMIF.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {values.map((v, i) => {
                            const Icon = v.icon;
                            return (
                                <div
                                    key={i}
                                    className="rounded-md border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/50 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#121620]"
                                >
                                    <div className="flex size-7 items-center justify-center rounded bg-[#4A5FD1]/10 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                        <Icon className="size-3.5" />
                                    </div>
                                    <h4 className="mt-3 font-display text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {v.title}
                                    </h4>
                                    <p className="mt-1 text-[11px] leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                        {v.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </PublicLayout>
    );
}
