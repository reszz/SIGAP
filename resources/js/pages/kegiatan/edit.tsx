import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    MapPin,
    Plus,
    Save,
    Trash2,
    Sparkles,
    Users,
    CheckCircle2,
    Palette,
    Layers,
} from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import StatusStiker from '@/components/ui/status-stiker';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';
import rundownRoutes from '@/routes/sesi/rundown';

// ─── Types ────────────────────────────────────────────────────────────────────

type RundownItem = {
    id: number;
    waktu: string;
    uraian_acara: string;
    urutan: number;
};

type Sesi = {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: RundownItem[];
};

type Kegiatan = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
};

type Props = { kegiatan: Kegiatan };

type KegiatanForm = {
    nama: string;
    deskripsi: string;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: string;
    warna: string;
};

type SesiForm = {
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
};

type RundownRow = { waktu: string; uraian_acara: string };

const PALET_WARNA = [
    '#4A5FD1',
    '#2E9E82',
    '#B8862E',
    '#727C8E',
    '#C4514A',
    '#3B4DB8',
    '#26856E',
    '#1E2430',
    '#586DE6',
    '#8FA0FA',
];

const EMPTY_ROW: RundownRow = { waktu: '', uraian_acara: '' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-medium text-[#C4514A]">{message}</p>;
}

// ─── RundownEditor — isolated per sesi ───────────────────────────────────────

function RundownEditor({ sesi, teamSlug }: { sesi: Sesi; teamSlug: string }) {
    const initialRows: RundownRow[] =
        sesi.rundown.length > 0
            ? [...sesi.rundown]
                  .sort((a, b) => a.urutan - b.urutan)
                  .map((r) => ({
                      waktu: r.waktu.slice(0, 5),
                      uraian_acara: r.uraian_acara,
                  }))
            : [];

    const form = useForm<{ rundown: RundownRow[] }>({ rundown: initialRows });

    function addRow() {
        form.setData('rundown', [...form.data.rundown, { ...EMPTY_ROW }]);
        Toast.fire({
            icon: 'info',
            title: 'Baris rundown ditambahkan.',
        });
    }

    async function removeRow(idx: number) {
        const row = form.data.rundown[idx];
        const label = row?.uraian_acara
            ? `"${row.uraian_acara}"`
            : `Baris #${idx + 1}`;

        const confirmed = await confirmDelete(
            'Item Rundown',
            `Hapus ${label} dari rundown?`,
        );
        if (!confirmed) return;

        form.setData(
            'rundown',
            form.data.rundown.filter((_, i) => i !== idx),
        );
        Toast.fire({
            icon: 'success',
            title: 'Baris rundown berhasil dihapus.',
        });
    }

    function updateRow(idx: number, field: keyof RundownRow, value: string) {
        const updated = form.data.rundown.map((r, i) =>
            i === idx ? { ...r, [field]: value } : r,
        );
        form.setData('rundown', updated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = form.data.rundown.map((r, i) => ({
            waktu: r.waktu,
            uraian_acara: r.uraian_acara,
            urutan: i + 1,
        }));

        router.put(
            rundownRoutes.upsert.url({ current_team: teamSlug, sesi: sesi.id }),
            { rundown: payload },
            {
                preserveScroll: true,
                onSuccess: () => {
                    Toast.fire({
                        icon: 'success',
                        title: 'Susunan rundown sesi berhasil disimpan!',
                    });
                },
            },
        );
    }

    return (
        <div className="mt-4 border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                    Susunan Acara (Rundown)
                </span>
                <button
                    type="button"
                    onClick={addRow}
                    className="flex items-center gap-1 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2430] hover:border-[#4A5FD1] hover:text-[#4A5FD1] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                >
                    <Plus className="size-3" /> Tambah Baris
                </button>
            </div>

            {form.data.rundown.length === 0 ? (
                <p className="py-1 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                    Belum ada baris rundown untuk sesi ini.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    {form.data.rundown.map((row, rIdx) => (
                        <div
                            key={rIdx}
                            className="flex items-center gap-2 rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-2 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                        >
                            <span className="font-mono-sigap w-6 text-center text-xs font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                                {rIdx + 1}
                            </span>
                            <input
                                type="time"
                                value={row.waktu}
                                onChange={(e) =>
                                    updateRow(rIdx, 'waktu', e.target.value)
                                }
                                className="font-mono-sigap w-24 rounded-md border border-[rgba(30,36,48,0.12)] px-2 py-1 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <input
                                type="text"
                                value={row.uraian_acara}
                                onChange={(e) =>
                                    updateRow(
                                        rIdx,
                                        'uraian_acara',
                                        e.target.value,
                                    )
                                }
                                placeholder="Uraian agenda acara..."
                                className="flex-1 rounded-md border border-[rgba(30,36,48,0.12)] px-2.5 py-1 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <button
                                type="button"
                                onClick={() => removeRow(rIdx)}
                                className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                title="Hapus baris rundown"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {form.data.rundown.length > 0 && (
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={submit}
                        className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                    >
                        <Save className="size-3.5" />
                        Simpan Rundown Sesi
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanEdit({ kegiatan }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const { data, setData, patch, processing, errors } = useForm<KegiatanForm>({
        nama: kegiatan.nama,
        deskripsi: kegiatan.deskripsi ?? '',
        tipe: kegiatan.tipe,
        kuota: kegiatan.kuota?.toString() ?? '',
        warna: kegiatan.warna,
    });

    const sesiForm = useForm<SesiForm>({
        tanggal: '',
        waktu_mulai: '',
        waktu_selesai: '',
        lokasi: '',
    });

    function submitKegiatan(e: React.FormEvent) {
        e.preventDefault();
        patch(`/${teamSlug}/pengurus/kegiatan/${kegiatan.id}`, {
            onSuccess: () => {
                showSuccess(
                    'Perubahan Disimpan!',
                    'Informasi kegiatan berhasil diperbarui.',
                );
            },
        });
    }

    function submitTambahSesi(e: React.FormEvent) {
        e.preventDefault();
        sesiForm.post(`/${teamSlug}/pengurus/kegiatan/${kegiatan.id}/sesi`, {
            onSuccess: () => {
                showSuccess(
                    'Sesi Ditambahkan!',
                    'Sesi kegiatan baru berhasil ditambahkan.',
                );
                sesiForm.reset();
            },
        });
    }

    async function deleteSesi(sesiId: number, idx: number) {
        if (kegiatan.sesi.length <= 1) {
            Toast.fire({
                icon: 'warning',
                title: 'Kegiatan harus memiliki minimal 1 sesi.',
            });
            return;
        }

        const confirmed = await confirmDelete(
            `Sesi ${idx + 1}`,
            'Apakah Anda yakin ingin menghapus sesi ini beserta data rundown terkait?',
        );
        if (!confirmed) return;

        router.delete(`/${teamSlug}/pengurus/sesi/${sesiId}`, {
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: `Sesi ${idx + 1} berhasil dihapus.`,
                });
            },
        });
    }

    return (
        <>
            <Head title={`Edit: ${kegiatan.nama}`} />

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ── Breadcrumb ── */}
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href={`/${teamSlug}/pengurus/kegiatan`}>
                                    Kegiatan
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link
                                    href={`/${teamSlug}/kegiatan/${kegiatan.id}`}
                                >
                                    {kegiatan.nama}
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Edit</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Link
                                href={`/${teamSlug}/kegiatan/${kegiatan.id}`}
                                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#727C8E] hover:text-[#4A5FD1] dark:text-[#8C97A8]"
                            >
                                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                                <span>Kembali ke Detail Kegiatan</span>
                            </Link>
                        </div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Edit Kegiatan
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Perbarui informasi kegiatan, kuota, tema warna, dan
                            susunan sesi kegiatan
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    {/* ── 1. Informasi Kegiatan ── */}
                    <form
                        onSubmit={submitKegiatan}
                        className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                    >
                        <div className="mb-6 flex items-center gap-3 border-b border-[rgba(30,36,48,0.08)] pb-4 dark:border-[rgba(255,255,255,0.08)]">
                            <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Informasi Utama
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Nama, deskripsi, tipe kehadiran, dan tema
                                    warna
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {/* Nama Kegiatan */}
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Nama Kegiatan{' '}
                                    <span className="text-[#C4514A]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) =>
                                        setData('nama', e.target.value)
                                    }
                                    placeholder="Nama Kegiatan"
                                    className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                />
                                <InputError message={errors.nama} />
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Deskripsi Kegiatan
                                </label>
                                <textarea
                                    value={data.deskripsi}
                                    onChange={(e) =>
                                        setData('deskripsi', e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Tuliskan informasi kegiatan..."
                                    className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                />
                                <InputError message={errors.deskripsi} />
                            </div>

                            {/* Tipe Kegiatan Radio Cards */}
                            <div>
                                <label className="mb-2 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    Tipe Kehadiran{' '}
                                    <span className="text-[#C4514A]">*</span>
                                </label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('tipe', 'wajib_hadir')
                                        }
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                                            data.tipe === 'wajib_hadir'
                                                ? 'border-[#4A5FD1] bg-[#4A5FD1]/10 dark:border-[#4A5FD1] dark:bg-[#4A5FD1]/20'
                                                : 'border-[rgba(30,36,48,0.12)] bg-white hover:border-[#4A5FD1]/40 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B]'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                                                data.tipe === 'wajib_hadir'
                                                    ? 'bg-[#4A5FD1] text-white'
                                                    : 'bg-[#F0F2F5] text-[#727C8E] dark:bg-[#21293A]'
                                            }`}
                                        >
                                            <Users className="size-3.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-display text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                    Wajib Hadir
                                                </span>
                                                {data.tipe ===
                                                    'wajib_hadir' && (
                                                    <CheckCircle2 className="size-3.5 text-[#4A5FD1]" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                                Semua anggota otomatis berhak
                                                hadir tanpa perlu mendaftar /
                                                RSVP.
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('tipe', 'terbuka')
                                        }
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                                            data.tipe === 'terbuka'
                                                ? 'border-[#2E9E82] bg-[#2E9E82]/10 dark:border-[#2E9E82] dark:bg-[#2E9E82]/20'
                                                : 'border-[rgba(30,36,48,0.12)] bg-white hover:border-[#2E9E82]/40 dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B]'
                                        }`}
                                    >
                                        <div
                                            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                                                data.tipe === 'terbuka'
                                                    ? 'bg-[#2E9E82] text-white'
                                                    : 'bg-[#F0F2F5] text-[#727C8E] dark:bg-[#21293A]'
                                            }`}
                                        >
                                            <Sparkles className="size-3.5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-display text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                    Terbuka (Ada Kuota)
                                                </span>
                                                {data.tipe === 'terbuka' && (
                                                    <CheckCircle2 className="size-3.5 text-[#2E9E82]" />
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                                Peserta harus mendaftar (RSVP)
                                                terlebih dahulu sesuai kuota.
                                            </p>
                                        </div>
                                    </button>
                                </div>
                                <InputError message={errors.tipe} />
                            </div>

                            {/* Kuota (Jika Terbuka) */}
                            {data.tipe === 'terbuka' && (
                                <div className="rounded-lg border border-[#2E9E82]/20 bg-[#2E9E82]/10 p-4 dark:bg-[#2E9E82]/20">
                                    <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#2E9E82] uppercase dark:text-[#34B394]">
                                        Kuota Maksimal Peserta{' '}
                                        <span className="text-[#C4514A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={data.kuota}
                                        onChange={(e) =>
                                            setData('kuota', e.target.value)
                                        }
                                        placeholder="Contoh: 100"
                                        className="font-mono-sigap w-44 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#2E9E82] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                    <InputError message={errors.kuota} />
                                </div>
                            )}

                            {/* Pilihan Warna */}
                            <div>
                                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                    <Palette className="size-3.5" />
                                    <span>Palet Warna Aksen</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {PALET_WARNA.map((w) => {
                                        const isSelected = data.warna === w;
                                        return (
                                            <button
                                                key={w}
                                                type="button"
                                                onClick={() =>
                                                    setData('warna', w)
                                                }
                                                className={`size-7 cursor-pointer rounded-full transition-all ${
                                                    isSelected
                                                        ? 'scale-110 ring-2 ring-[#4A5FD1] ring-offset-2 dark:ring-offset-[#181E2B]'
                                                        : 'opacity-80 hover:scale-105 hover:opacity-100'
                                                }`}
                                                style={{ backgroundColor: w }}
                                                title={`Pilih warna ${w}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6 flex items-center justify-end gap-3 border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
                            <Link
                                href={`/${teamSlug}/kegiatan/${kegiatan.id}`}
                                className="rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                            >
                                <Save className="size-3.5" />
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Informasi'}
                            </button>
                        </div>
                    </form>

                    {/* ── 2. Daftar Sesi & Inline Rundown ── */}
                    <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="mb-6 flex items-center gap-3 border-b border-[rgba(30,36,48,0.08)] pb-4 dark:border-[rgba(255,255,255,0.08)]">
                            <div className="flex size-8 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                <CalendarDays className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Jadwal Sesi ({kegiatan.sesi.length})
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Kelola jadwal waktu pelaksanaan dan susunan
                                    rundown setiap sesi
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {kegiatan.sesi.map((sesi, idx) => (
                                <div
                                    key={sesi.id}
                                    className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-4.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                >
                                    {/* Header Sesi */}
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded-md bg-[#4A5FD1]/12 px-2.5 py-0.5 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                    Sesi {idx + 1}
                                                </span>
                                                <StatusStiker
                                                    status={sesi.status}
                                                />
                                            </div>
                                            <p className="mt-1.5 font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                {new Date(
                                                    sesi.tanggal + 'T00:00:00',
                                                ).toLocaleDateString('id-ID', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                <span className="font-mono-sigap flex items-center gap-1 text-[11px]">
                                                    <Clock className="size-3 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                                    <span>
                                                        {sesi.waktu_mulai.slice(
                                                            0,
                                                            5,
                                                        )}{' '}
                                                        –{' '}
                                                        {sesi.waktu_selesai.slice(
                                                            0,
                                                            5,
                                                        )}{' '}
                                                        WIB
                                                    </span>
                                                </span>
                                                <span className="flex items-center gap-1 text-[11px]">
                                                    <MapPin className="size-3 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                                    <span>{sesi.lokasi}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() =>
                                                deleteSesi(sesi.id, idx)
                                            }
                                            disabled={kegiatan.sesi.length <= 1}
                                            title={
                                                kegiatan.sesi.length <= 1
                                                    ? 'Kegiatan harus punya minimal 1 sesi'
                                                    : 'Hapus sesi'
                                            }
                                            className="flex items-center gap-1 rounded-md p-1.5 text-xs font-medium text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A] disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            <Trash2 className="size-3.5" />
                                            <span className="hidden sm:inline">
                                                Hapus Sesi
                                            </span>
                                        </button>
                                    </div>

                                    {/* Rundown editor inline */}
                                    <RundownEditor
                                        sesi={sesi}
                                        teamSlug={teamSlug}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Form tambah sesi baru */}
                        <form
                            onSubmit={submitTambahSesi}
                            className="mt-6 rounded-lg border border-dashed border-[#4A5FD1]/40 bg-[#4A5FD1]/5 p-4.5 dark:border-[#4A5FD1]/30"
                        >
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                <h3 className="font-display text-xs font-semibold tracking-wider text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                                    Tambah Sesi Baru
                                </h3>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                        Tanggal Sesi{' '}
                                        <span className="text-[#C4514A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        value={sesiForm.data.tanggal}
                                        onChange={(e) =>
                                            sesiForm.setData(
                                                'tanggal',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                    <InputError
                                        message={sesiForm.errors.tanggal}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                        Waktu Mulai{' '}
                                        <span className="text-[#C4514A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={sesiForm.data.waktu_mulai}
                                        onChange={(e) =>
                                            sesiForm.setData(
                                                'waktu_mulai',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                    <InputError
                                        message={sesiForm.errors.waktu_mulai}
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                        Waktu Selesai{' '}
                                        <span className="text-[#C4514A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={sesiForm.data.waktu_selesai}
                                        onChange={(e) =>
                                            sesiForm.setData(
                                                'waktu_selesai',
                                                e.target.value,
                                            )
                                        }
                                        className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                    <InputError
                                        message={sesiForm.errors.waktu_selesai}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                        Lokasi Pelaksanaan{' '}
                                        <span className="text-[#C4514A]">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        value={sesiForm.data.lokasi}
                                        onChange={(e) =>
                                            sesiForm.setData(
                                                'lokasi',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Gedung Serbaguna Lt. 2"
                                        className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    />
                                    <InputError
                                        message={sesiForm.errors.lokasi}
                                    />
                                </div>
                            </div>

                            <div className="mt-3.5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={sesiForm.processing}
                                    className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                                >
                                    <Plus className="size-3.5" />
                                    {sesiForm.processing
                                        ? 'Menambahkan...'
                                        : 'Tambah Sesi Baru'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}
