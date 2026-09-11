import { Head, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, MapPin, CalendarDays, UserCircle, AlertCircle } from 'lucide-react';
import StatusStiker from '@/components/ui/status-stiker';

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

    return (
        <>
            <Head title={`Presensi — ${kegiatan.nama}`} />

            <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 dark:bg-[#0E121A]">
                <div className="w-full max-w-md">
                    {/* Card */}
                    <div className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        {/* Header dengan warna tema */}
                        <div
                            className="p-5 text-white"
                            style={{ backgroundColor: kegiatan.warna || '#4A5FD1' }}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono-sigap rounded-md bg-black/20 px-2 py-0.5 text-xs font-semibold text-white uppercase tracking-wider">
                                    {sesi.kode_presensi}
                                </span>
                                <StatusStiker status={sesi.status} />
                            </div>
                            <h1 className="font-display mt-3 text-lg font-semibold leading-tight text-white">
                                {kegiatan.nama}
                            </h1>
                            <div className="mt-2.5 flex flex-wrap items-center gap-3 font-mono-sigap text-xs text-white/90">
                                <span className="flex items-center gap-1.5 font-sans">
                                    <CalendarDays className="size-3.5" />
                                    {formatTanggal(sesi.tanggal)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="size-3.5" />
                                    {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)} WIB
                                </span>
                                <span className="flex items-center gap-1.5 font-sans">
                                    <MapPin className="size-3.5" />
                                    {sesi.lokasi}
                                </span>
                            </div>
                        </div>

                        <div className="p-5">
                            {/* Sudah presensi */}
                            {(sudahPresensi || wasSuccessful) ? (
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20">
                                        <CheckCircle2 className="size-7" />
                                    </div>
                                    <div>
                                        <p className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Presensi Berhasil Dicatat
                                        </p>
                                        <p className="mt-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Kehadiran Anda telah terkonfirmasi ke dalam sistem kegiatan.
                                        </p>
                                    </div>
                                </div>
                            ) : sesi.status !== 'berlangsung' ? (
                                /* Sesi tidak berlangsung */
                                <div className="flex flex-col items-center gap-3 py-6 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-full bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20">
                                        <AlertCircle className="size-7" />
                                    </div>
                                    <div>
                                        <p className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Presensi Belum Dibuka
                                        </p>
                                        <p className="mt-1 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            {sesi.status === 'terjadwal'
                                                ? 'Sesi ini belum dimulai. Presensi hanya dapat diisi saat sesi sedang berlangsung.'
                                                : 'Sesi ini telah selesai. Batas waktu presensi telah berakhir.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                /* Form presensi */
                                <form onSubmit={submit} className="flex flex-col gap-4">
                                    {/* Identitas (read-only) */}
                                    <div className="rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40">
                                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                            Identitas Pengguna
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                <UserCircle className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">{user.name}</p>
                                                <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">NIM: {user.nim}</p>
                                                <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Catatan opsional */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                            Catatan Kehadiran <span className="font-normal text-[#727C8E] dark:text-[#8C97A8]">(opsional)</span>
                                        </label>
                                        <textarea
                                            value={data.catatan}
                                            onChange={e => setData('catatan', e.target.value)}
                                            rows={3}
                                            placeholder="Tuliskan catatan jika ada (contoh: izin datang terlambat karena kuliah)..."
                                            className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                        />
                                        {errors.catatan && <p className="mt-1 text-xs text-[#C4514A]">{errors.catatan}</p>}
                                        {(errors as Record<string, string | undefined>).rsvp && (
                                            <div className="mt-2 rounded-md bg-[#C4514A]/10 p-2.5 text-xs text-[#C4514A] dark:bg-[#C4514A]/20 dark:text-[#D9615A]">
                                                {(errors as Record<string, string | undefined>).rsvp}
                                            </div>
                                        )}
                                        {(errors as Record<string, string | undefined>).presensi && (
                                            <div className="mt-2 rounded-md bg-[#B8862E]/10 p-2.5 text-xs text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                {(errors as Record<string, string | undefined>).presensi}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A5FD1] py-2.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="size-4" />
                                        <span>{processing ? 'Menyimpan...' : 'Konfirmasi Kehadiran'}</span>
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
