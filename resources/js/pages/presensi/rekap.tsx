import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, QrCode, Users, XCircle } from 'lucide-react';

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

    const statusCls = {
        terjadwal: 'bg-blue-100 text-blue-700',
        berlangsung: 'bg-green-100 text-green-700',
        selesai: 'bg-neutral-100 text-neutral-500',
    };

    const presensiUrl = `${window.location.origin}/${teamSlug}/presensi/${sesi.kode_presensi}`;

    return (
        <>
            <Head title={`Rekap Presensi — ${kegiatan.nama}`} />

            <div className="mx-auto max-w-2xl p-4 md:p-6">
                {/* Back link */}
                <Link
                    href={`/${teamSlug}/kegiatan/${kegiatan.id}/detail`}
                    className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke Detail Kegiatan
                </Link>

                {/* Header */}
                <div
                    className="overflow-hidden rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900"
                    style={{ borderTop: `4px solid ${kegiatan.warna}` }}
                >
                    <div className="p-5">
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            Rekap Presensi
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">{kegiatan.nama}</p>

                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                            <span>{formatTanggal(sesi.tanggal)}</span>
                            <span>·</span>
                            <span>
                                <Clock className="mr-1 inline size-3.5" />
                                {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)}
                            </span>
                            <span>·</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusCls[sesi.status]}`}>
                                {sesi.status === 'terjadwal' ? 'Terjadwal' : sesi.status === 'berlangsung' ? 'Berlangsung' : 'Selesai'}
                            </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                    {sudahHadir.length} / {totalAnggota} hadir
                                </span>
                                <span className="text-neutral-400">{pct}%</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Kode presensi box */}
                    <div className="border-t border-neutral-100 p-5 dark:border-neutral-800">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                                    <QrCode className="size-3.5" />
                                    Link Presensi untuk Anggota
                                </p>
                                <a
                                    href={presensiUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="break-all text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                >
                                    {presensiUrl}
                                </a>
                                <p className="mt-1 text-xs text-neutral-400">
                                    Kode: <span className="font-mono font-semibold">{sesi.kode_presensi}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sudah hadir */}
                <section className="mt-5 rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="mb-3 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-green-500" />
                        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            Sudah Hadir ({sudahHadir.length})
                        </h2>
                    </div>

                    {sudahHadir.length === 0 ? (
                        <p className="text-sm text-neutral-400">Belum ada yang presensi.</p>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {sudahHadir.map((item) => (
                                <div key={item.user_id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">NIM: {item.nim}</p>
                                        {item.catatan && (
                                            <p className="mt-0.5 text-xs text-neutral-400 italic">
                                                {item.catatan}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="size-3.5" />
                                        {item.waktu_isi}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Belum hadir */}
                <section className="mt-4 rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                    <div className="mb-3 flex items-center gap-2">
                        <XCircle className="size-4 text-red-400" />
                        <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            Belum Hadir ({belumHadir.length})
                        </h2>
                    </div>

                    {belumHadir.length === 0 ? (
                        <p className="text-sm text-green-600 dark:text-green-400">
                            Semua anggota sudah hadir! 🎉
                        </p>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {belumHadir.map((item) => (
                                <div key={item.user_id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">NIM: {item.nim}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
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
