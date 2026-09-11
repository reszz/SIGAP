import { Head, Link } from '@inertiajs/react';
import { ShieldAlert, AlertTriangle, FileQuestion, ServerCrash, ArrowLeft } from 'lucide-react';

type Props = {
    status: number;
    message?: string;
};

export default function ErrorPage({ status, message }: Props) {
    const titles: Record<number, string> = {
        403: 'Akses Ditolak (403 Forbidden)',
        404: 'Halaman Tidak Ditemukan (404)',
        500: 'Terjadi Kesalahan Server (500)',
        503: 'Layanan Sedang Pemeliharaan (503)',
    };

    const descriptions: Record<number, string> = {
        403: message ?? 'Maaf, Anda tidak memiliki hak akses atau izin yang sesuai untuk melihat atau melakukan tindakan pada halaman ini.',
        404: 'Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.',
        500: 'Terjadi masalah pada server internal. Tim pengembang sedang menanganinya.',
        503: 'Sistem sedang dalam proses pemeliharaan. Silakan coba kembali beberapa saat lagi.',
    };

    const icons: Record<number, React.ReactNode> = {
        403: <ShieldAlert className="size-10 text-[#C4514A]" />,
        404: <FileQuestion className="size-10 text-[#B8862E]" />,
        500: <ServerCrash className="size-10 text-[#C4514A]" />,
        503: <AlertTriangle className="size-10 text-[#4A5FD1]" />,
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] p-6 text-center dark:bg-[#12161F]">
            <Head title={`${status} - ${titles[status] ?? 'Kesalahan'}`} />

            <div className="w-full max-w-md rounded-2xl border border-[rgba(30,36,48,0.1)] bg-white p-8 shadow-xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                <div className="mx-auto mb-4 flex size-18 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                    {icons[status] ?? <ShieldAlert className="size-10 text-[#C4514A]" />}
                </div>

                <h1 className="font-display text-xl font-bold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                    {titles[status] ?? 'Terjadi Kesalahan'}
                </h1>

                <p className="mt-2 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                    {descriptions[status] ?? descriptions[403]}
                </p>

                <div className="mt-6 flex justify-center">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#4A5FD1] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8]"
                    >
                        <ArrowLeft className="size-3.5" />
                        Kembali ke Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
