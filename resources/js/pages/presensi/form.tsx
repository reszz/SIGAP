import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, MapPin, CalendarDays, UserCircle, AlertCircle } from 'lucide-react';

type Sesi = {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    kode_presensi: string;
};

type Kegiatan = {
    id: number;
    nama: string;
    tipe: 'wajib_hadir' | 'terbuka';
    warna: string;
};

type UserInfo = {
    name: string;
    nim: string;
    email: string;
};

type Props = {
    sesi: Sesi;
    kegiatan: Kegiatan;
    user: UserInfo;
    sudahPresensi: boolean;
};

export default function PresensiForm({ sesi, kegiatan, user, sudahPresensi }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const { data, setData, post, processing, errors, wasSuccessful } = useForm({
        catatan: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${teamSlug}/presensi/${sesi.kode_presensi}`);
    }

    const formatTanggal = (iso: string) =>
        new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });

    const statusMap = {
        terjadwal:   { label: 'Terjadwal',   cls: 'bg-blue-100 text-blue-700' },
        berlangsung: { label: 'Berlangsung', cls: 'bg-green-100 text-green-700' },
        selesai:     { label: 'Selesai',     cls: 'bg-neutral-100 text-neutral-500' },
    };

    return (
        <>
            <Head title={`Presensi — ${kegiatan.nama}`} />

            <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
                        {/* Header berwarna sesuai kegiatan */}
                        <div
                            className="p-5"
                            style={{ backgroundColor: kegiatan.warna + '20', borderBottom: `3px solid ${kegiatan.warna}` }}
                        >
                            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                {kegiatan.nama}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="size-4" />
                                    {formatTanggal(sesi.tanggal)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-4" />
                                    {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    {sesi.lokasi}
                                </span>
                            </div>
                            <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusMap[sesi.status].cls}`}>
                                {statusMap[sesi.status].label}
                            </span>
                        </div>

                        <div className="p-5">
                            {/* Sudah presensi */}
                            {(sudahPresensi || wasSuccessful) ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                        <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                            Presensi Tercatat!
                                        </p>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            Kehadiranmu sudah berhasil dicatat untuk sesi ini.
                                        </p>
                                    </div>
                                </div>
                            ) : sesi.status !== 'berlangsung' ? (
                                /* Sesi tidak berlangsung */
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                        <AlertCircle className="size-8 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                            Presensi belum dibuka
                                        </p>
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {sesi.status === 'terjadwal'
                                                ? 'Sesi ini belum dimulai. Presensi hanya bisa diisi saat sesi sedang berlangsung.'
                                                : 'Sesi ini sudah selesai. Waktu presensi sudah berakhir.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Form presensi */
                                <form onSubmit={submit} className="flex flex-col gap-5">
                                    {/* Identitas (read-only) */}
                                    <div className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800">
                                        <p className="mb-2 text-xs font-medium text-neutral-500">Identitas Kamu</p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                                <UserCircle className="size-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{user.name}</p>
                                                <p className="text-xs text-neutral-500">NIM: {user.nim}</p>
                                                <p className="text-xs text-neutral-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Catatan opsional */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Catatan <span className="font-normal text-neutral-400">(opsional)</span>
                                        </label>
                                        <textarea
                                            value={data.catatan}
                                            onChange={e => setData('catatan', e.target.value)}
                                            rows={3}
                                            placeholder="Tulis catatan jika ada (misal: izin terlambat karena...)"
                                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                                        />
                                        {errors.catatan && <p className="mt-1 text-xs text-red-500">{errors.catatan}</p>}
                                        {errors.rsvp && (
                                            <div className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                                {errors.rsvp}
                                            </div>
                                        )}
                                        {errors.presensi && (
                                            <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                                                {errors.presensi}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        {processing ? 'Menyimpan...' : 'Konfirmasi Kehadiran'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
