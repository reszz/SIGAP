import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    MapPin,
    Plus,
    Trash2,
    Sparkles,
    Users,
    CheckCircle2,
    Palette,
} from 'lucide-react';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// ─── Types ────────────────────────────────────────────────────────────────────

type RundownForm = {
    waktu: string;
    uraian_acara: string;
};

type SesiForm = {
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    rundown: RundownForm[];
};

type KegiatanForm = {
    nama: string;
    deskripsi: string;
    tipe: 'wajib_hadir' | 'terbuka' | '';
    kuota: string;
    warna: string;
    sesi: SesiForm[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_RUNDOWN: RundownForm = { waktu: '', uraian_acara: '' };

const EMPTY_SESI: SesiForm = {
    tanggal: '',
    waktu_mulai: '',
    waktu_selesai: '',
    lokasi: '',
    rundown: [],
};

const PALET_WARNA = [
    '#4A5FD1', '#2E9E82', '#B8862E', '#727C8E', '#C4514A',
    '#3B4DB8', '#26856E', '#1E2430', '#586DE6', '#8FA0FA',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-[#C4514A] font-medium">{message}</p>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanCreate() {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const { data, setData, post, processing, errors } = useForm<KegiatanForm>({
        nama: '',
        deskripsi: '',
        tipe: 'wajib_hadir',
        kuota: '',
        warna: '#4A5FD1',
        sesi: [{ ...EMPTY_SESI, rundown: [] }],
    });

    // ── Sesi helpers ──────────────────────────────────────────────────────────

    function addSesi() {
        setData('sesi', [...data.sesi, { ...EMPTY_SESI, rundown: [] }]);
        Toast.fire({
            icon: 'info',
            title: `Sesi ${data.sesi.length + 1} ditambahkan.`,
        });
    }

    async function removeSesi(idx: number) {
        if (data.sesi.length <= 1) {
            Toast.fire({
                icon: 'warning',
                title: 'Minimal harus ada 1 sesi kegiatan.',
            });
            return;
        }

        const confirmed = await confirmDelete(
            `Sesi ${idx + 1}`,
            'Hapus sesi ini dari rancangan kegiatan?',
        );
        if (!confirmed) return;

        setData('sesi', data.sesi.filter((_, i) => i !== idx));
        Toast.fire({
            icon: 'success',
            title: `Sesi ${idx + 1} berhasil dihapus.`,
        });
    }

    function updateSesi(idx: number, field: keyof Omit<SesiForm, 'rundown'>, value: string) {
        const updated = data.sesi.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
        setData('sesi', updated);
    }

    // ── Rundown helpers ───────────────────────────────────────────────────────

    function addRundown(sesiIdx: number) {
        const updated = data.sesi.map((s, i) =>
            i === sesiIdx ? { ...s, rundown: [...s.rundown, { ...EMPTY_RUNDOWN }] } : s,
        );
        setData('sesi', updated);
        Toast.fire({
            icon: 'info',
            title: 'Baris rundown ditambahkan.',
        });
    }

    async function removeRundown(sesiIdx: number, rundownIdx: number) {
        const row = data.sesi[sesiIdx]?.rundown[rundownIdx];
        const label = row?.uraian_acara ? `"${row.uraian_acara}"` : `Baris #${rundownIdx + 1}`;

        const confirmed = await confirmDelete(
            'Item Rundown',
            `Hapus ${label} dari susunan rundown sesi ${sesiIdx + 1}?`,
        );
        if (!confirmed) return;

        const updated = data.sesi.map((s, i) =>
            i === sesiIdx
                ? { ...s, rundown: s.rundown.filter((_, j) => j !== rundownIdx) }
                : s,
        );
        setData('sesi', updated);
        Toast.fire({
            icon: 'success',
            title: 'Baris rundown berhasil dihapus.',
        });
    }

    function updateRundown(
        sesiIdx: number,
        rundownIdx: number,
        field: keyof RundownForm,
        value: string,
    ) {
        const updated = data.sesi.map((s, i) =>
            i === sesiIdx
                ? {
                      ...s,
                      rundown: s.rundown.map((r, j) =>
                          j === rundownIdx ? { ...r, [field]: value } : r,
                      ),
                  }
                : s,
        );
        setData('sesi', updated);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${teamSlug}/pengurus/kegiatan`, {
            onSuccess: () => {
                showSuccess(
                    'Kegiatan Berhasil Dibuat!',
                    'Kegiatan dan susunan jadwal sesi telah tersimpan ke sistem.',
                );
            },
        });
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Tambah Kegiatan Baru" />

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
                            <BreadcrumbPage>Create</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <Link
                                href={`/${teamSlug}/pengurus/kegiatan`}
                                className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#727C8E] hover:text-[#4A5FD1] dark:text-[#8C97A8]"
                            >
                                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                                <span>Kembali ke Kelola Kegiatan</span>
                            </Link>
                        </div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Tambah Kegiatan Baru
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Rancang informasi acara, tema warna, tipe kehadiran,
                            dan jadwal sesi
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── 1. Informasi Kegiatan ── */}
                    <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="mb-6 flex items-center gap-3 border-b border-[rgba(30,36,48,0.08)] pb-4 dark:border-[rgba(255,255,255,0.08)]">
                            <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Informasi Utama
                                </h2>
                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Nama, deskripsi, tipe kehadiran, dan aksen
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
                                    placeholder="Contoh: Musyawarah Anggota & Seminar Nasional"
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
                                    placeholder="Tuliskan tujuan kegiatan, target peserta, atau penjelasan singkat acara..."
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
                    </section>

                    {/* ── 2. Jadwal Sesi & Rundown ── */}
                    <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(30,36,48,0.08)] pb-4 dark:border-[rgba(255,255,255,0.08)]">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                    <CalendarDays className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        Jadwal Sesi & Rundown
                                    </h2>
                                    <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                        Tentukan tanggal, jam, lokasi, dan
                                        susunan acara
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={addSesi}
                                className="flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4A5FD1] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8FA0FA]"
                            >
                                <Plus className="size-3.5" /> Tambah Sesi
                            </button>
                        </div>

                        <div className="flex flex-col gap-6">
                            {data.sesi.map((sesi, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-4.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                >
                                    {/* Header Sesi */}
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className="rounded-md bg-[#4A5FD1]/12 px-2.5 py-0.5 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            Sesi {idx + 1}
                                        </span>

                                        {data.sesi.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSesi(idx)}
                                                className="flex items-center gap-1 text-xs font-medium text-[#727C8E] transition hover:text-[#C4514A]"
                                            >
                                                <Trash2 className="size-3.5" />{' '}
                                                Hapus Sesi
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* Tanggal */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                Tanggal Sesi{' '}
                                                <span className="text-[#C4514A]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                value={sesi.tanggal}
                                                onChange={(e) =>
                                                    updateSesi(
                                                        idx,
                                                        'tanggal',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                            <InputError
                                                message={
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[`sesi.${idx}.tanggal`]
                                                }
                                            />
                                        </div>

                                        {/* Waktu Mulai */}
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                <Clock className="size-3 text-[#4A5FD1]" />
                                                <span>Waktu Mulai</span>{' '}
                                                <span className="text-[#C4514A]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="time"
                                                value={sesi.waktu_mulai}
                                                onChange={(e) =>
                                                    updateSesi(
                                                        idx,
                                                        'waktu_mulai',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                            <InputError
                                                message={
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[`sesi.${idx}.waktu_mulai`]
                                                }
                                            />
                                        </div>

                                        {/* Waktu Selesai */}
                                        <div>
                                            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                <Clock className="size-3 text-[#4A5FD1]" />
                                                <span>Waktu Selesai</span>{' '}
                                                <span className="text-[#C4514A]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="time"
                                                value={sesi.waktu_selesai}
                                                onChange={(e) =>
                                                    updateSesi(
                                                        idx,
                                                        'waktu_selesai',
                                                        e.target.value,
                                                    )
                                                }
                                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                            <InputError
                                                message={
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[
                                                        `sesi.${idx}.waktu_selesai`
                                                    ]
                                                }
                                            />
                                        </div>

                                        {/* Lokasi */}
                                        <div className="sm:col-span-2">
                                            <label className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                <MapPin className="size-3 text-[#4A5FD1]" />
                                                <span>Lokasi / Ruangan</span>{' '}
                                                <span className="text-[#C4514A]">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                value={sesi.lokasi}
                                                onChange={(e) =>
                                                    updateSesi(
                                                        idx,
                                                        'lokasi',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Gedung Aula Utama Lt. 2 / Zoom Meeting"
                                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-medium text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                            <InputError
                                                message={
                                                    (
                                                        errors as Record<
                                                            string,
                                                            string
                                                        >
                                                    )[`sesi.${idx}.lokasi`]
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* ── Susunan Rundown untuk Sesi Ini ── */}
                                    <div className="mt-5 border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
                                        <div className="mb-3 flex items-center justify-between">
                                            <span className="text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                Rundown Sesi {idx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => addRundown(idx)}
                                                className="flex items-center gap-1 text-[11px] font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                                            >
                                                <Plus className="size-3" />{' '}
                                                Tambah Baris
                                            </button>
                                        </div>

                                        {sesi.rundown.length === 0 ? (
                                            <p className="rounded-md border border-dashed border-[rgba(30,36,48,0.12)] py-3 text-center text-xs text-[#727C8E] dark:border-[rgba(255,255,255,0.12)] dark:text-[#8C97A8]">
                                                Belum ada rundown. Klik
                                                &ldquo;Tambah Baris&rdquo; untuk
                                                menyusun acara.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {sesi.rundown.map((r, rIdx) => (
                                                    <div
                                                        key={rIdx}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <input
                                                            type="time"
                                                            value={r.waktu}
                                                            onChange={(e) =>
                                                                updateRundown(
                                                                    idx,
                                                                    rIdx,
                                                                    'waktu',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="font-mono-sigap w-24 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2 py-1.5 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={
                                                                r.uraian_acara
                                                            }
                                                            onChange={(e) =>
                                                                updateRundown(
                                                                    idx,
                                                                    rIdx,
                                                                    'uraian_acara',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder={`Contoh: Registrasi Peserta & Coffee Break`}
                                                            className="min-w-0 flex-1 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeRundown(
                                                                    idx,
                                                                    rIdx,
                                                                )
                                                            }
                                                            className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                                                            title="Hapus baris"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── Submit Action ── */}
                    <div className="flex items-center justify-end gap-3 pb-8">
                        <Link
                            href={`/${teamSlug}/pengurus/kegiatan`}
                            className="rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-5 py-2 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#4A5FD1] px-6 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            <CheckCircle2 className="size-4" />
                            <span>
                                {processing
                                    ? 'Menyimpan...'
                                    : 'Simpan & Terbitkan Kegiatan'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
