import { ShieldCheck } from 'lucide-react';

type Props = {
    roleName?: string;
    message?: string;
};

export default function ReadOnlyBanner({
    roleName = 'Pembina',
    message,
}: Props) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-[#2E9E82]/25 bg-[#2E9E82]/8 px-4 py-3 text-xs text-[#207560] dark:border-[#2E9E82]/30 dark:bg-[#2E9E82]/15 dark:text-[#34B394]">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#2E9E82]/20 text-[#207560] dark:bg-[#2E9E82]/30 dark:text-[#34B394]">
                <ShieldCheck className="size-4" />
            </div>
            <div className="leading-relaxed">
                <span className="font-semibold">Mode Pemantauan ({roleName}):</span>{' '}
                {message ?? 'Anda memiliki hak akses baca untuk memantau data dan progres acara ini secara real-time. Modifikasi data dibatasi khusus bagi panitia pelaksana.'}
            </div>
        </div>
    );
}
