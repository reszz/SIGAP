import { Link } from '@inertiajs/react';
import { Sparkles, Calendar, ArrowLeft } from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

interface PlaceholderProps {
    title: string;
    subtitle: string;
}

export default function Placeholder({ title, subtitle }: PlaceholderProps) {
    return (
        <PublicLayout
            title={`${title} — SIGAP`}
            description={subtitle}
        >
            <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-[#B8862E]/30 bg-[#B8862E]/10 px-3 py-1 text-xs font-semibold text-[#B8862E] dark:border-[#B8862E]/40 dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                    <Sparkles className="size-3.5" />
                    <span>Dalam Pengembangan / Segera Hadir</span>
                </div>

                <h1 className="font-display text-3xl font-semibold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                    {title}
                </h1>

                <p className="mx-auto mt-3 max-w-lg text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                    {subtitle} Halaman ini sedang dipersiapkan dan akan segera tersedia pada pembaruan rilis berikutnya.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-medium text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Beranda</span>
                    </Link>

                    <Link
                        href="/kalender"
                        className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8]"
                    >
                        <Calendar className="size-3.5" />
                        <span>Lihat Kalender Kegiatan</span>
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}
