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

            <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-neutral-900">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertTriangle className="size-8 text-red-500" />
                    </div>
                    <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        Akses Presensi Ditolak
                    </h1>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {alasan}
                    </p>
                    <p className="mt-1 text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        Kegiatan: {kegiatan.nama}
                    </p>
                    <div className="mt-6 flex flex-col gap-2">
                        <Link
                            href={`/${teamSlug}/kalender`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            Lihat Kalender & RSVP Dulu
                        </Link>
                        <Link
                            href={`/${teamSlug}/anggota/dashboard`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                        >
                            <ArrowLeft className="size-4" /> Kembali ke Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
