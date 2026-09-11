import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, QrCode, Users, XCircle } from 'lucide-react';
import StatusStiker from '@/components/ui/status-stiker';

type HadirItem = {
    user_id: number;
    name: string;
    nim: string;
    waktu_isi: string;
    catatan: string | null;
};

type BelumHadirItem = {
    user_id: number;
    name: string;
    nim: string;
};

type Props = {
    sesi: {
        id: number;
        tanggal: string;
        waktu_mulai: string;
        waktu_selesai: string;
        lokasi: string;
        status: 'terjadwal' | 'berlangsung' | 'selesai';
        kode_presensi: string;
    };
    kegiatan: { id: number; nama: string; warna: string };
    sudahHadir: HadirItem[];
    belumHadir: BelumHadirItem[];
    totalAnggota: number;
};

export default function PresensiRekap({
    sesi,
    kegiatan,
    sudahHadir,
    belumHadir,
    totalAnggota,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const pct = totalAnggota > 0 ? Math.round((sudahHadir.length / totalAnggota) * 100) : 0;

    function formatTanggal(iso: string) {
        return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    const presensiUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${teamSlug}/presensi/${sesi.kode_presensi}`;

    return (
        <>
            <Head title={`Rekap Presensi — ${kegiatan.nama}`} />

            <div className="mx-auto max-w-2xl p-4 md:p-6">
                {/* Back link */}
                <Link
                    href={`/${teamSlug}/kegiatan/${kegiatan.id}`}
                    className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#727C8E] transition hover:text-[#4A5FD1] dark:text-[#8C97A8]"
                >
                    <ArrowLeft className="size-3.5" />
                    Kembali ke Detail Kegiatan
                </Link>

                {/* Header Card */}
                <div
                    className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                >
                    <div
                        className="h-1 w-full"
                        style={{ backgroundColor: kegiatan.warna || '#4A5FD1' }}
                    />
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Rekap Presensi Sesi
                                </h1>
                                <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">{kegiatan.nama}</p>
                            </div>
                            <StatusStiker status={sesi.status} />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            <span>{formatTanggal(sesi.tanggal)}</span>
                            <span>·</span>
                            <span className="font-mono-sigap">
                                <Clock className="mr-1 inline size-3 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)} WIB
                            </span>
                            <span>·</span>
                            <span>{sesi.lokasi}</span>
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    <span className="font-mono-sigap">{sudahHadir.length}</span> / <span className="font-mono-sigap">{totalAnggota}</span> hadir
                                </span>
                                <span className="font-mono-sigap font-semibold text-[#2E9E82] dark:text-[#34B394]">{pct}%</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-[#F6F7F9] dark:bg-[#21293A]">
                                <div
                                    className="h-full rounded-full bg-[#2E9E82] transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kode presensi box */}
                    <div className="border-t border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/40 p-4 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/30">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                                    <QrCode className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                    Link Presensi untuk Anggota
                                </p>
                                <a
                                    href={presensiUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all font-mono-sigap text-xs font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                                >
                                    {presensiUrl}
                                </a>
                                <p className="mt-1 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    Kode: <span className="font-mono-sigap font-semibold text-[#1E2430] dark:text-[#E6ECF5]">{sesi.kode_presensi}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sudah hadir */}
                <section className="mt-5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-[#2E9E82]" />
                            <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Sudah Hadir
                            </h2>
                        </div>
                        <span className="font-mono-sigap rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-[11px] font-medium text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                            {sudahHadir.length} Orang
                        </span>
                    </div>

                    {sudahHadir.length === 0 ? (
                        <p className="py-4 text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">Belum ada peserta yang mengisi presensi.</p>
                    ) : (
                        <div className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {sudahHadir.map((item) => (
                                <div key={item.user_id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div>
                                        <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {item.name}
                                        </p>
                                        <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">NIM: {item.nim}</p>
                                        {item.catatan && (
                                            <p className="mt-0.5 text-[11px] italic text-[#727C8E] dark:text-[#8C97A8]">
                                                &ldquo;{item.catatan}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 font-mono-sigap text-[11px] text-[#2E9E82] dark:text-[#34B394]">
                                        <CheckCircle2 className="size-3.5" />
                                        {item.waktu_isi}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Belum hadir */}
                <section className="mt-4 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <XCircle className="size-4 text-[#727C8E]" />
                            <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Belum Hadir
                            </h2>
                        </div>
                        <span className="font-mono-sigap rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                            {belumHadir.length} Orang
                        </span>
                    </div>

                    {belumHadir.length === 0 ? (
                        <p className="py-4 text-center text-xs font-semibold text-[#2E9E82] dark:text-[#34B394]">
                            Semua anggota telah hadir presensi.
                        </p>
                    ) : (
                        <div className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {belumHadir.map((item) => (
                                <div key={item.user_id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div>
                                        <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {item.name}
                                        </p>
                                        <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">NIM: {item.nim}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        <Users className="size-3.5" />
                                        Belum hadir
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}
