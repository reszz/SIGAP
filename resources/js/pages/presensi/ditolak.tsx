import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

type Props = {
    kegiatan: { id: number; nama: string; warna: string };
    alasan: string;
};

export default function PresensiDitolak({ kegiatan, alasan }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    return (
        <>
            <Head title="Presensi Ditolak" />

            <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 dark:bg-[#0E121A]">
                <div className="w-full max-w-md rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-8 text-center shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#C4514A]/12 text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
                        <AlertTriangle className="size-7" />
                    </div>
                    <h1 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        Akses Presensi Ditolak
                    </h1>
                    <p className="mt-2 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                        {alasan}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        Kegiatan: {kegiatan.nama}
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                        <Link
                            href={`/${teamSlug}/kalender`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                        >
                            Lihat Kalender & RSVP Dulu
                        </Link>
                        <Link
                            href={`/${teamSlug}/dashboard`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] px-4 py-2 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        >
                            <ArrowLeft className="size-3.5" /> Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
