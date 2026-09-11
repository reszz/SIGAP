import PublicLayout from '@/layouts/public-layout';
import { Layers, Users } from 'lucide-react';

interface DivisiItem {
    id: number;
    nama_divisi: string;
    deskripsi: string | null;
    urutan_tampil: number;
    pengurus_count: number;
}

interface Props {
    divisi: DivisiItem[];
}

const ACCENT_COLORS = [
    { bg: 'bg-[#4A5FD1]/10 dark:bg-[#4A5FD1]/20', text: 'text-[#4A5FD1] dark:text-[#8FA0FA]', border: 'border-[#4A5FD1]/20' },
    { bg: 'bg-[#2E9E82]/10 dark:bg-[#2E9E82]/20', text: 'text-[#2E9E82] dark:text-[#34B394]', border: 'border-[#2E9E82]/20' },
    { bg: 'bg-[#E07B3F]/10 dark:bg-[#E07B3F]/20', text: 'text-[#E07B3F] dark:text-[#F09A65]', border: 'border-[#E07B3F]/20' },
    { bg: 'bg-[#7C5FD1]/10 dark:bg-[#7C5FD1]/20', text: 'text-[#7C5FD1] dark:text-[#A48FFA]', border: 'border-[#7C5FD1]/20' },
    { bg: 'bg-[#D15F8E]/10 dark:bg-[#D15F8E]/20', text: 'text-[#D15F8E] dark:text-[#FA8FB8]', border: 'border-[#D15F8E]/20' },
    { bg: 'bg-[#2E7E9E]/10 dark:bg-[#2E7E9E]/20', text: 'text-[#2E7E9E] dark:text-[#5CBCDE]', border: 'border-[#2E7E9E]/20' },
];

export default function DivisiPage({ divisi }: Props) {
    return (
        <PublicLayout
            title="Divisi & Bidang Kerja — SIGAP"
            description="Informasi divisi kerja, fungsi pokok, dan jumlah pengurus pada masing-masing bidang organisasi."
        >
            {/* ── Page Header ── */}
            <section className="border-b border-[rgba(30,36,48,0.08)] bg-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]/60">
                <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[#4A5FD1]/30 bg-[#4A5FD1]/10 px-2.5 py-1 text-xs font-medium text-[#4A5FD1] dark:border-[#4A5FD1]/40 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                        <Layers className="size-3.5" />
                        <span>Keorganisasian</span>
                    </div>
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                        Divisi & Bidang Kerja
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                        Pembagian divisi kerja dan bidang kepengurusan yang menjalankan roda program kerja organisasi secara terstruktur.
                    </p>
                </div>
            </section>

            {/* ── Content ── */}
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 min-h-145">
                {divisi.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-16 text-center dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B]">
                        <Layers className="mb-3 size-10 text-[#D0D5E0] dark:text-[#3A4055]" />
                        <p className="text-sm font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Belum ada data divisi yang ditambahkan.
                        </p>
                        <p className="mt-1 text-xs text-[#9BA4B4] dark:text-[#6A7385]">
                            Data akan ditampilkan setelah pengurus menambahkan divisi di panel kelola.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {divisi.map((d, i) => {
                            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
                            return (
                                <div
                                    key={d.id}
                                    className="flex flex-col rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs transition hover:border-[#4A5FD1]/25 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                >
                                    {/* Icon */}
                                    <div
                                        className={`flex size-9 items-center justify-center rounded-md ${accent.bg} ${accent.text} mb-4`}
                                    >
                                        <Layers className="size-4" />
                                    </div>

                                    {/* Name */}
                                    <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {d.nama_divisi}
                                    </h2>

                                    {/* Description */}
                                    {d.deskripsi ? (
                                        <p className="mt-2 flex-1 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                            {d.deskripsi}
                                        </p>
                                    ) : (
                                        <p className="mt-2 flex-1 text-xs italic text-[#9BA4B4] dark:text-[#6A7385]">
                                            Deskripsi belum tersedia.
                                        </p>
                                    )}

                                    {/* Footer — member count */}
                                    <div className="mt-4 flex items-center gap-1.5 border-t border-[rgba(30,36,48,0.06)] pt-3 dark:border-[rgba(255,255,255,0.06)]">
                                        <Users className="size-3.5 text-[#9BA4B4] dark:text-[#6A7385]" />
                                        <span className="text-xs text-[#9BA4B4] dark:text-[#6A7385]">
                                            {d.pengurus_count > 0
                                                ? `${d.pengurus_count} pengurus`
                                                : 'Belum ada pengurus'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
