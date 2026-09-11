import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    Download,
    FileImage,
    FileText,
    Mail,
    MapPin,
    Pencil,
    Sparkles,
    Star,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import StatusStiker from '@/components/ui/status-stiker';
import QuotaPill from '@/components/ui/quota-pill';
import { download as dokumentasiDownload } from '@/routes/dokumentasi';
import { upsert as evaluasiUpsert } from '@/routes/evaluasi';
import pengurus from '@/routes/pengurus';
import { show as presensiShow } from '@/routes/presensi';
import { index as sesiPresensiIndex } from '@/routes/sesi/presensi';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// ─── Types ────────────────────────────────────────────────────────────────────

type User = {
    id: number;
    name: string;
    nim?: string;
    role?: string;
};

type Rundown = {
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
    kode_presensi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: Rundown[];
};

type Kepanitiaan = {
    id: number;
    kegiatan_id: number;
    user_id: number;
    jabatan: string;
    user: User | null;
};

type Tugas = {
    id: number;
    kegiatan_id: number;
    jabatan: string;
    pic_user_id: number;
    deskripsi_tugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    prioritas: 'rendah' | 'sedang' | 'tinggi';
    deadline: string | null;
    pic: User | null;
};

type Rsvp = {
    id: number;
    status: 'terdaftar' | 'dibatalkan';
    user: User | null;
};

type Anggaran = {
    id: number;
    jenis: 'pemasukan' | 'pengeluaran';
    sumber_kategori: string;
    estimasi: string;
    realisasi: string | null;
};

type Dokumentasi = {
    id: number;
    tipe: 'foto' | 'notulen';
    file_path: string;
    uploaded_by: User | null;
};

type Evaluasi = {
    id: number;
    rating: number;
    komentar: string | null;
    user: User | null;
};

type Surat = {
    id: number;
    nomor_surat: string;
    perihal: string;
    tipe: 'masuk' | 'keluar';
    tanggal_surat: string | null;
};

type Kegiatan = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
    kepanitiaan: Kepanitiaan[];
    tugas: Tugas[];
    rsvp: Rsvp[];
    anggaran: Anggaran[];
    dokumentasi: Dokumentasi[];
    evaluasi: Evaluasi[];
    surat?: Surat[];
};

type AnggotaTeamItem = { id: number; name: string };

type EvaluasiSaya = {
    id: number;
    rating: number;
    komentar: string | null;
} | null;

type Props = {
    kegiatan: Kegiatan;
    canManage: boolean;
    anggotaTeam: AnggotaTeamItem[];
    authUserId: number;
    evaluasiSaya: EvaluasiSaya;
    kegiatanSelesai: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JABATAN_INFO: Record<
    string,
    { label: string; bg: string; text: string }
> = {
    ketua_pelaksana: {
        label: 'Ketua Pelaksana',
        bg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
    },
    bendahara: {
        label: 'Bendahara',
        bg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
        text: 'text-[#2E9E82] dark:text-[#34B394]',
    },
    sekretaris: {
        label: 'Sekretaris',
        bg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
    },
    div_acara: {
        label: 'Divisi Acara',
        bg: 'bg-[#B8862E]/12 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
    div_humas: {
        label: 'Divisi Humas',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    div_pdd: {
        label: 'Divisi PDD',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
    div_logistik: {
        label: 'Divisi Logistik',
        bg: 'bg-[#B8862E]/12 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
};

const PRIORITAS_MAP: Record<
    string,
    { label: string; bg: string; text: string }
> = {
    tinggi: {
        label: 'Tinggi',
        bg: 'bg-[#C4514A]/12 dark:bg-[#C4514A]/20',
        text: 'text-[#C4514A] dark:text-[#D9615A]',
    },
    sedang: {
        label: 'Sedang',
        bg: 'bg-[#B8862E]/12 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
    rendah: {
        label: 'Rendah',
        bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
        text: 'text-[#727C8E] dark:text-[#8C97A8]',
    },
};

function formatDateLong(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function formatDateTile(value: string): {
    day: number;
    month: string;
    weekday: string;
} {
    const d = new Date(`${value}T00:00:00`);
    return {
        day: d.getDate(),
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        weekday: d.toLocaleDateString('id-ID', { weekday: 'short' }),
    };
}

function formatMoney(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(num);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KegiatanShow({
    kegiatan,
    canManage,
    evaluasiSaya,
    kegiatanSelesai,
}: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    // Active tab filter: 'all' | 'jadwal' | 'panitia' | 'anggaran' | 'rsvp' | 'dokumentasi' | 'evaluasi'
    const [activeTab, setActiveTab] = useState<string>('all');

    // Form evaluasi state
    const { data, setData, post, processing, wasSuccessful } = useForm({
        rating: evaluasiSaya?.rating ?? 5,
        komentar: evaluasiSaya?.komentar ?? '',
    });

    const submitEvaluasi = (e: React.FormEvent) => {
        e.preventDefault();
        post(
            evaluasiUpsert.url({
                current_team: teamSlug,
                kegiatan: kegiatan.id,
            }),
            { preserveScroll: true },
        );
    };

    const registeredCount =
        kegiatan.rsvp?.filter((r) => r.status === 'terdaftar').length ?? 0;

    const totalEstPemasukan = (kegiatan.anggaran ?? [])
        .filter((a) => a.jenis === 'pemasukan')
        .reduce((sum, a) => sum + Number(a.estimasi), 0);

    const totalEstPengeluaran = (kegiatan.anggaran ?? [])
        .filter((a) => a.jenis === 'pengeluaran')
        .reduce((sum, a) => sum + Number(a.estimasi), 0);

    const saldoEstimasi = totalEstPemasukan - totalEstPengeluaran;

    const avgRating =
        kegiatan.evaluasi && kegiatan.evaluasi.length > 0
            ? (
                  kegiatan.evaluasi.reduce((sum, e) => sum + e.rating, 0) /
                  kegiatan.evaluasi.length
              ).toFixed(1)
            : null;

    const suratList = kegiatan.surat ?? [];
    const eventColor = kegiatan.warna ?? '#4A5FD1';

    const tabs = [
        { id: 'all', label: 'Semua Ringkasan', icon: Sparkles },
        {
            id: 'jadwal',
            label: `Jadwal (${kegiatan.sesi.length})`,
            icon: Calendar,
        },
        {
            id: 'panitia',
            label: `Panitia & Tugas (${(kegiatan.kepanitiaan?.length ?? 0) + (kegiatan.tugas?.length ?? 0)})`,
            icon: Users,
        },
        ...(canManage
            ? [{ id: 'anggaran', label: 'Anggaran', icon: CircleDollarSign }]
            : []),
        ...(kegiatan.tipe === 'terbuka'
            ? [
                  {
                      id: 'rsvp',
                      label: `RSVP (${registeredCount})`,
                      icon: CheckCircle2,
                  },
              ]
            : []),
        {
            id: 'dokumentasi',
            label: `Dokumentasi (${kegiatan.dokumentasi.length})`,
            icon: FileText,
        },
        {
            id: 'evaluasi',
            label: `Evaluasi (${kegiatan.evaluasi.length})`,
            icon: Star,
        },
    ];

    return (
        <>
            <Head title={kegiatan.nama} />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
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
                            <BreadcrumbPage>Detail</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                {/* ── Top Navigation & Quick Actions ── */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={`/${teamSlug}/kalender`}
                        className="group inline-flex items-center gap-2 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                    >
                        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Kembali ke Kalender</span>
                    </Link>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Link
                                href={pengurus.kegiatan.edit.url({
                                    current_team: teamSlug,
                                    kegiatan: kegiatan.id,
                                })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                            >
                                <Pencil className="size-3.5" />
                                <span>Edit Kegiatan</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Hero Banner ── */}
                <header className="relative overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 sm:p-8 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    {/* Top flat color bar 3px */}
                    <div
                        className="absolute inset-x-0 top-0 h-1 transition-colors"
                        style={{ backgroundColor: eventColor }}
                    />

                    <div className="flex flex-col gap-5 pt-1">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#4A5FD1]/12 px-2.5 py-0.5 text-xs font-medium text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <Sparkles className="size-3.5" />
                                    {kegiatan.tipe === 'terbuka'
                                        ? 'Kegiatan Terbuka'
                                        : 'Wajib Hadir'}
                                </span>

                                {kegiatan.tipe === 'terbuka' &&
                                    kegiatan.kuota != null && (
                                        <QuotaPill
                                            registered={registeredCount}
                                            quota={kegiatan.kuota}
                                        />
                                    )}
                            </div>

                            {/* Status Sticker */}
                            {kegiatan.sesi?.[0] && (
                                <StatusStiker
                                    status={kegiatan.sesi[0].status}
                                />
                            )}
                        </div>

                        {/* Title & Description */}
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                                {kegiatan.nama}
                            </h1>
                            {kegiatan.deskripsi ? (
                                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#2E3542] dark:text-[#E6ECF5]">
                                    {kegiatan.deskripsi}
                                </p>
                            ) : (
                                <p className="mt-2 text-xs text-[#727C8E]/70 italic dark:text-[#8C97A8]/70">
                                    Tidak ada deskripsi tambahan.
                                </p>
                            )}
                        </div>

                        {/* 4 Summary Highlight Tiles */}
                        <div className="grid grid-cols-2 gap-3 border-t border-[rgba(30,36,48,0.06)] pt-5 sm:grid-cols-4 dark:border-[rgba(255,255,255,0.06)]">
                            {/* 1. Sesi */}
                            <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/60 p-3.5 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/40">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <Calendar className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono-sigap font-display text-base leading-tight font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {kegiatan.sesi.length} Sesi
                                    </p>
                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        Jadwal Acara
                                    </p>
                                </div>
                            </div>

                            {/* 2. Panitia */}
                            <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/60 p-3.5 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/40">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                    <Users className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono-sigap font-display text-base leading-tight font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {kegiatan.kepanitiaan?.length ?? 0}{' '}
                                        Panitia
                                    </p>
                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        Struktur Tim
                                    </p>
                                </div>
                            </div>

                            {/* 3. Peserta */}
                            <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/60 p-3.5 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/40">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                    <CheckCircle2 className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono-sigap font-display text-base leading-tight font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {registeredCount} Peserta
                                    </p>
                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        {kegiatan.tipe === 'terbuka'
                                            ? 'RSVP Terdaftar'
                                            : 'Target'}
                                    </p>
                                </div>
                            </div>

                            {/* 4. Rating */}
                            <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.06)] bg-[#F6F7F9]/60 p-3.5 dark:border-[rgba(255,255,255,0.06)] dark:bg-[#21293A]/40">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                    <Star className="size-4.5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-mono-sigap font-display text-base leading-tight font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {avgRating ? `${avgRating} ★` : '–'}
                                    </p>
                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        {kegiatan.evaluasi.length} Evaluasi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Segmented Navigation Tabs ── */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                                    isActive
                                        ? 'bg-[#4A5FD1] text-white'
                                        : 'border border-[rgba(30,36,48,0.12)] bg-white text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]'
                                }`}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Modular Content Layout ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column: Jadwal & Dokumentasi & Surat */}
                    <div className="flex flex-col gap-6">
                        {/* 1. Jadwal & Rundown */}
                        {(activeTab === 'all' || activeTab === 'jadwal') && (
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <Calendar className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Jadwal & Rundown Acara
                                        </h2>
                                    </div>
                                    <span className="font-mono-sigap rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                        {kegiatan.sesi.length} Sesi
                                    </span>
                                </div>

                                {kegiatan.sesi.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <Calendar className="size-6 text-[#727C8E]/50 dark:text-[#8C97A8]/50" />
                                        <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Belum ada jadwal sesi.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {kegiatan.sesi.map((sesi, idx) => {
                                            const tile = formatDateTile(
                                                sesi.tanggal,
                                            );

                                            return (
                                                <div
                                                    key={sesi.id}
                                                    className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-4 transition hover:border-[#4A5FD1]/40 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            {/* Date Tile */}
                                                            <div className="flex size-11 flex-col items-center justify-center rounded-md border border-[rgba(30,36,48,0.08)] bg-white dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                                                <span className="text-[9px] font-bold text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                                                                    {tile.month}
                                                                </span>
                                                                <span className="font-mono-sigap font-display text-base leading-none font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                    {tile.day}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <h3 className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                    Sesi{' '}
                                                                    {idx + 1} •{' '}
                                                                    {
                                                                        tile.weekday
                                                                    }
                                                                    , {tile.day}{' '}
                                                                    {tile.month}
                                                                </h3>
                                                                <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                    {formatDateLong(
                                                                        sesi.tanggal,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <StatusStiker
                                                            status={sesi.status}
                                                        />
                                                    </div>

                                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                        <span className="font-mono-sigap flex items-center gap-1.5 text-[11px]">
                                                            <Clock className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
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
                                                        <span className="flex items-center gap-1.5 text-[11px]">
                                                            <MapPin className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                                            <span>
                                                                {sesi.lokasi}
                                                            </span>
                                                        </span>
                                                    </div>

                                                    {/* Presensi Action Buttons */}
                                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[rgba(30,36,48,0.06)] pt-3 dark:border-[rgba(255,255,255,0.06)]">
                                                        {canManage && (
                                                            <Link
                                                                href={sesiPresensiIndex.url(
                                                                    {
                                                                        current_team:
                                                                            teamSlug,
                                                                        sesi: sesi.id,
                                                                    },
                                                                )}
                                                                className="flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                                                            >
                                                                <Users className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                                                Rekap Presensi
                                                            </Link>
                                                        )}

                                                        {sesi.status ===
                                                            'berlangsung' &&
                                                            sesi.kode_presensi && (
                                                                <Link
                                                                    href={presensiShow.url(
                                                                        {
                                                                            current_team:
                                                                                teamSlug,
                                                                            kode: sesi.kode_presensi,
                                                                        },
                                                                    )}
                                                                    className="flex items-center gap-1.5 rounded-lg bg-[#2E9E82] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#26856E]"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    Isi Presensi
                                                                    Sekarang
                                                                </Link>
                                                            )}
                                                    </div>

                                                    {/* Rundown Timeline */}
                                                    {sesi.rundown &&
                                                        sesi.rundown.length >
                                                            0 && (
                                                            <div className="mt-3 rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                                                <p className="mb-2 text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                                    Rundown
                                                                    Acara
                                                                </p>
                                                                <div className="relative space-y-2 border-l-2 border-dashed border-[#4A5FD1]/30 pl-3.5 dark:border-[#4A5FD1]/20">
                                                                    {[
                                                                        ...sesi.rundown,
                                                                    ]
                                                                        .sort(
                                                                            (
                                                                                a,
                                                                                b,
                                                                            ) =>
                                                                                a.urutan -
                                                                                b.urutan,
                                                                        )
                                                                        .map(
                                                                            (
                                                                                r,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        r.id
                                                                                    }
                                                                                    className="relative flex items-start gap-2.5 text-xs"
                                                                                >
                                                                                    <span className="absolute top-1 -left-[19px] size-2 rounded-full bg-[#4A5FD1]" />
                                                                                    <span className="font-mono-sigap shrink-0 font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                                                                        {r.waktu.slice(
                                                                                            0,
                                                                                            5,
                                                                                        )}
                                                                                    </span>
                                                                                    <span className="text-[#1E2430] dark:text-[#E6ECF5]">
                                                                                        {
                                                                                            r.uraian_acara
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2. Dokumentasi & Notulen */}
                        {(activeTab === 'all' ||
                            activeTab === 'dokumentasi') && (
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <FileText className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Dokumentasi & Notulen
                                        </h2>
                                    </div>
                                    <span className="font-mono-sigap rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                        {kegiatan.dokumentasi.length} Berkas
                                    </span>
                                </div>

                                {kegiatan.dokumentasi.length === 0 ? (
                                    <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                        Belum ada file dokumentasi.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {kegiatan.dokumentasi.map((d) => (
                                            <a
                                                key={d.id}
                                                href={dokumentasiDownload.url({
                                                    current_team: teamSlug,
                                                    dokumentasi: d.id,
                                                })}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group flex items-center justify-between rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-2.5 text-xs transition hover:border-[#4A5FD1]/40 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                                            >
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                        {d.tipe === 'foto' ? (
                                                            <FileImage className="size-3.5" />
                                                        ) : (
                                                            <FileText className="size-3.5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                                            {d.file_path
                                                                .split('/')
                                                                .pop()}
                                                        </p>
                                                        <p className="text-[10px] text-[#727C8E] capitalize dark:text-[#8C97A8]">
                                                            Tipe: {d.tipe} •
                                                            Diunggah oleh:{' '}
                                                            {d.uploaded_by
                                                                ?.name ?? '-'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Download className="size-4 shrink-0 text-[#727C8E] transition group-hover:text-[#4A5FD1]" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Surat Menyurat */}
                        {suratList.length > 0 &&
                            (activeTab === 'all' || activeTab === 'surat') && (
                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                    <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                <Mail className="size-4" />
                                            </div>
                                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                Surat Menyurat
                                            </h2>
                                        </div>
                                        <span className="font-mono-sigap rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                            {suratList.length} Surat
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {suratList.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex items-center justify-between rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-2.5 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                            >
                                                <div>
                                                    <p className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {s.perihal}
                                                    </p>
                                                    <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                        {s.nomor_surat}
                                                    </p>
                                                </div>
                                                <span className="rounded-md bg-[#4A5FD1]/12 px-2 py-0.5 text-[10px] font-medium text-[#4A5FD1] capitalize dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                    {s.tipe}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                    </div>

                    {/* Right Column: Panitia, Anggaran, RSVP, Evaluasi */}
                    <div className="flex flex-col gap-6">
                        {/* 4. Panitia & Tugas */}
                        {(activeTab === 'all' || activeTab === 'panitia') && (
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                            <Users className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Struktur Panitia & Tugas
                                        </h2>
                                    </div>
                                    <span className="font-mono-sigap rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                        {kegiatan.kepanitiaan?.length ?? 0}{' '}
                                        Panitia
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {/* Panitia Grid */}
                                    {kegiatan.kepanitiaan?.length === 0 ? (
                                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Belum ada struktur panitia.
                                        </p>
                                    ) : (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {kegiatan.kepanitiaan?.map((p) => {
                                                const info = JABATAN_INFO[
                                                    p.jabatan
                                                ] ?? {
                                                    label: p.jabatan,
                                                    bg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
                                                    text: 'text-[#727C8E] dark:text-[#8C97A8]',
                                                };

                                                const initials = p.user?.name
                                                    ? p.user.name
                                                          .split(' ')
                                                          .slice(0, 2)
                                                          .map((n) => n[0])
                                                          .join('')
                                                          .toUpperCase()
                                                    : '?';

                                                return (
                                                    <div
                                                        key={p.id}
                                                        className="flex items-center gap-2.5 rounded-md border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-2.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                                                    >
                                                        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1] text-xs font-semibold text-white">
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {p.user?.name ??
                                                                    '-'}
                                                            </p>
                                                            <span
                                                                className={`py-0.2 mt-0.5 inline-block rounded-md px-1.5 text-[10px] font-medium ${info.bg} ${info.text}`}
                                                            >
                                                                {info.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Tugas List */}
                                    {kegiatan.tugas &&
                                        kegiatan.tugas.length > 0 && (
                                            <div className="border-t border-[rgba(30,36,48,0.06)] pt-4 dark:border-[rgba(255,255,255,0.06)]">
                                                <p className="mb-2.5 text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                                    Daftar Tugas (
                                                    {kegiatan.tugas.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {kegiatan.tugas.map((t) => {
                                                        const prioritasInfo =
                                                            PRIORITAS_MAP[
                                                                t.prioritas
                                                            ] ??
                                                            PRIORITAS_MAP.sedang;

                                                        return (
                                                            <div
                                                                key={t.id}
                                                                className="rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-2.5 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                        {
                                                                            t.deskripsi_tugas
                                                                        }
                                                                    </span>
                                                                    <StatusStiker
                                                                        status={
                                                                            t.status
                                                                        }
                                                                    />
                                                                </div>
                                                                <div className="mt-2 flex items-center justify-between text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                                    <span>
                                                                        PIC:{' '}
                                                                        {t.pic
                                                                            ?.name ??
                                                                            '-'}
                                                                    </span>
                                                                    <span
                                                                        className={`py-0.2 rounded-md px-1.5 font-medium ${prioritasInfo.bg} ${prioritasInfo.text}`}
                                                                    >
                                                                        {
                                                                            prioritasInfo.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {/* 5. Anggaran (Pengurus only) */}
                        {canManage &&
                            (activeTab === 'all' ||
                                activeTab === 'anggaran') && (
                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                    <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-7.5 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                <CircleDollarSign className="size-4" />
                                            </div>
                                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                Ringkasan Anggaran
                                            </h2>
                                        </div>
                                    </div>

                                    {kegiatan.anggaran.length === 0 ? (
                                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Belum ada data anggaran.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                        Pemasukan
                                                    </p>
                                                    <p className="font-mono-sigap mt-0.5 font-display text-base font-semibold text-[#2E9E82] dark:text-[#34B394]">
                                                        {formatMoney(
                                                            totalEstPemasukan,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                        Pengeluaran
                                                    </p>
                                                    <p className="font-mono-sigap mt-0.5 font-display text-base font-semibold text-[#C4514A] dark:text-[#D9615A]">
                                                        {formatMoney(
                                                            totalEstPengeluaran,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-lg border border-[#4A5FD1]/20 bg-[#4A5FD1]/10 p-3 text-center dark:bg-[#4A5FD1]/20">
                                                <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                    Saldo Estimasi
                                                </p>
                                                <p
                                                    className={`font-mono-sigap mt-0.5 font-display text-lg font-semibold ${
                                                        saldoEstimasi >= 0
                                                            ? 'text-[#4A5FD1] dark:text-[#8FA0FA]'
                                                            : 'text-[#C4514A]'
                                                    }`}
                                                >
                                                    {formatMoney(saldoEstimasi)}
                                                </p>
                                            </div>

                                            <div className="space-y-1">
                                                {kegiatan.anggaran
                                                    .slice(0, 4)
                                                    .map((a) => (
                                                        <div
                                                            key={a.id}
                                                            className="flex items-center justify-between rounded-md bg-[#F6F7F9] px-3 py-2 text-xs dark:bg-[#21293A]"
                                                        >
                                                            <span className="font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {
                                                                    a.sumber_kategori
                                                                }
                                                            </span>
                                                            <span
                                                                className={`font-mono-sigap font-semibold ${
                                                                    a.jenis ===
                                                                    'pemasukan'
                                                                        ? 'text-[#2E9E82] dark:text-[#34B394]'
                                                                        : 'text-[#C4514A] dark:text-[#D9615A]'
                                                                }`}
                                                            >
                                                                {a.jenis ===
                                                                'pemasukan'
                                                                    ? '+'
                                                                    : '-'}{' '}
                                                                {formatMoney(
                                                                    Number(
                                                                        a.estimasi,
                                                                    ),
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* 6. RSVP (Terbuka only) */}
                        {kegiatan.tipe === 'terbuka' &&
                            (activeTab === 'all' || activeTab === 'rsvp') && (
                                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                    <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-7.5 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                <CheckCircle2 className="size-4" />
                                            </div>
                                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                Peserta Terdaftar (RSVP)
                                            </h2>
                                        </div>
                                        <span className="font-mono-sigap rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-[11px] font-medium text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                            {registeredCount} Peserta
                                        </span>
                                    </div>

                                    {registeredCount === 0 ? (
                                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Belum ada peserta yang mendaftar.
                                        </p>
                                    ) : (
                                        <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
                                            {kegiatan.rsvp
                                                .filter(
                                                    (r) =>
                                                        r.status ===
                                                        'terdaftar',
                                                )
                                                .map((r) => {
                                                    const initials = r.user
                                                        ?.name
                                                        ? r.user.name
                                                              .split(' ')
                                                              .slice(0, 2)
                                                              .map((n) => n[0])
                                                              .join('')
                                                              .toUpperCase()
                                                        : '?';

                                                    return (
                                                        <div
                                                            key={r.id}
                                                            className="flex items-center gap-2.5 rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-2 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                                        >
                                                            <div className="flex size-6.5 items-center justify-center rounded-full bg-[#2E9E82]/12 text-[10px] font-semibold text-[#2E9E82]">
                                                                {initials}
                                                            </div>
                                                            <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                {r.user?.name ??
                                                                    '[Peserta]'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* 7. Evaluasi & Feedback */}
                        {(activeTab === 'all' || activeTab === 'evaluasi') && (
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="mb-4 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                            <Star className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Evaluasi & Ulasan
                                        </h2>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Score Card */}
                                    {kegiatan.evaluasi.length > 0 ? (
                                        <div className="flex items-center justify-between rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]">
                                            <div>
                                                <p className="font-mono-sigap font-display text-2xl font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                                    {avgRating} ★
                                                </p>
                                                <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                    Rata-rata dari{' '}
                                                    {kegiatan.evaluasi.length}{' '}
                                                    ulasan peserta
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            Belum ada evaluasi.
                                        </p>
                                    )}

                                    {/* Evaluation Form */}
                                    {!canManage && kegiatanSelesai && (
                                        <form
                                            onSubmit={submitEvaluasi}
                                            className="space-y-2.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30"
                                        >
                                            <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                Beri Evaluasi Anda
                                            </p>
                                            <div className="flex items-center gap-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() =>
                                                            setData(
                                                                'rating',
                                                                star,
                                                            )
                                                        }
                                                        className={`cursor-pointer text-lg transition ${
                                                            star <= data.rating
                                                                ? 'text-[#B8862E]'
                                                                : 'text-[#727C8E]/30 dark:text-[#8C97A8]/30'
                                                        }`}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea
                                                value={data.komentar}
                                                onChange={(e) =>
                                                    setData(
                                                        'komentar',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Tulis ulasan Anda..."
                                                rows={2}
                                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white p-2.5 text-xs text-[#1E2430] focus:ring-2 focus:ring-[#4A5FD1] focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-lg bg-[#4A5FD1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                            >
                                                {wasSuccessful
                                                    ? 'Tersimpan!'
                                                    : 'Kirim Evaluasi'}
                                            </button>
                                        </form>
                                    )}

                                    {/* Review Comments */}
                                    {kegiatan.evaluasi.length > 0 && (
                                        <div className="space-y-2">
                                            {kegiatan.evaluasi
                                                .slice(0, 3)
                                                .map((e) => (
                                                    <div
                                                        key={e.id}
                                                        className="rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-3 text-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                                Anonim
                                                            </span>
                                                            <span className="font-mono-sigap font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                                                {'★'.repeat(
                                                                    e.rating,
                                                                )}
                                                            </span>
                                                        </div>
                                                        {e.komentar && (
                                                            <p className="mt-1 text-xs leading-relaxed text-[#727C8E] dark:text-[#8C97A8]">
                                                                {e.komentar}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
