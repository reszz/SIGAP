import { Link, usePage } from '@inertiajs/react';
import { ShieldAlert, ArrowLeft, Calendar, HelpCircle } from 'lucide-react';

type Props = {
    title?: string;
    message?: string;
    actionType?: 'panitia' | 'rundown' | 'anggaran' | 'dokumentasi' | 'evaluasi' | 'surat' | 'umum';
};

export default function AccessRestrictionCard({
    title = 'Akses Terbatas',
    message,
    actionType = 'umum',
}: Props) {
    const { url, props } = usePage<any>();
    const teamSlug = url.split('/')[1] || 'hmif';
    const userRole = props.auth?.user?.role ?? 'anggota';

    const defaultMessages: Record<string, string> = {
        panitia: 'Halaman ini dikhususkan bagi Pengurus Organisasi serta Anggota yang memiliki penugasan kepanitiaan pada kegiatan. Saat ini Anda belum ditugaskan dalam susunan panitia untuk kegiatan di periode ini.',
        rundown: 'Pengaturan susunan rundown acara dikhususkan untuk Pengurus, Ketua Pelaksana, serta Divisi Acara kegiatan. Anda belum memiliki penugasan divisi terkait pada kegiatan ini.',
        anggaran: 'Pengelolaan anggaran kegiatan dikhususkan untuk Pengurus, Bendahara, serta Divisi Logistik. Anda belum memiliki penugasan terkait anggaran kegiatan.',
        dokumentasi: 'Pengunggahan dokumentasi dan notulen dikhususkan untuk Pengurus, Sekretaris, serta Divisi PDD kegiatan. Anda dapat memantau dokumentasi publik setelah kegiatan dipublikasikan.',
        evaluasi: 'Akses ringkasan evaluasi kegiatan dikhususkan bagi Pengurus dan Ketua Pelaksana untuk keperluan evaluasi internal kepengurusan.',
        surat: 'Pengelolaan surat menyurat dikhususkan bagi Sekretaris dan Divisi Humas kegiatan. Anda belum memiliki penugasan divisi terkait surat menyurat.',
        umum: 'Anda tidak memiliki hak akses untuk mengelola modul ini pada kegiatan yang dipilih.',
    };

    const displayMessage = message ?? defaultMessages[actionType] ?? defaultMessages.umum;

    return (
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-[rgba(30,36,48,0.1)] bg-white p-8 text-center shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#C4514A]/10 text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
                <ShieldAlert className="size-7" />
            </div>

            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#727C8E]/10 px-3 py-0.5 font-mono-sigap text-[11px] font-semibold text-[#727C8E] uppercase tracking-wider dark:text-[#8C97A8]">
                Peran: {userRole}
            </span>

            <h2 className="font-display text-lg font-semibold tracking-tight text-[#1E2430] sm:text-xl dark:text-[#E6ECF5]">
                {title}
            </h2>

            <p className="mt-2 max-w-md text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                {displayMessage}
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#F6F7F9] px-3.5 py-2 text-[11px] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                <HelpCircle className="size-3.5 shrink-0 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                <span>Butuh akses? Hubungi Ketua Pelaksana atau Pengurus untuk penugasan kepanitiaan.</span>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                    href={`/${teamSlug}/dashboard`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-semibold text-[#1E2430] shadow-2xs transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                >
                    <ArrowLeft className="size-3.5" />
                    Kembali ke Dashboard
                </Link>
                <Link
                    href={`/${teamSlug}/kalender`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#3B4DB8]"
                >
                    <Calendar className="size-3.5" />
                    Lihat Kalender Acara
                </Link>
            </div>
        </div>
    );
}
