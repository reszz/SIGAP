import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarCheck2,
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    TrendingUp,
    Users,
    Newspaper,
    Sparkles,
    Building2,
} from 'lucide-react';
import { useState } from 'react';
import EventDetailCard from '@/components/event-detail-card';
import StatusStiker from '@/components/ui/status-stiker';
import SigapPulse from '@/components/ui/sigap-pulse';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus, { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import { kegiatanBreadcrumbs } from '@/lib/breadcrumbs';

// ─── Types ────────────────────────────────────────────────────────────────────

type SesiMendatang = {
    id: number;
    kegiatanId: number;
    kegiatanNama: string;
    warna: string | null;
    tanggal: string;
    waktuMulai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    kegiatanTipe: 'wajib_hadir' | 'terbuka';
    rsvpStatus: 'terdaftar' | 'dibatalkan' | null;
    kuota: number | null;
    kuotaTerpakai: number | null;
};

type KegiatanTerbaruItem = {
    id: number;
    nama: string;
    tipe: 'wajib_hadir' | 'terbuka';
    warna: string | null;
    created_at: string | null;
};

type PengurusStats = {
    totalKegiatan: number;
    totalAnggota: number;
    totalPresensi: number;
    kegiatanAktif: number;
    totalArtikel: number;
    wishesPending: number;
    totalDivisi: number;
};

type AnggotaStats = {
    totalKehadiran: number;
    rsvpAktif: number;
};

type RekapMember = {
    id: number;
    name: string;
    nim: string;
    hadir: number;
};

type AktivitasItem = {
    tipe: 'presensi';
    kegiatanNama: string;
    waktu: string;
};

type TugasItem = {
    id: number;
    kegiatanId: number;
    kegiatanNama: string;
    jabatan: string;
    deskripsiTugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    prioritas: 'rendah' | 'sedang' | 'tinggi';
    deadline: string | null;
};

type ArtikelTerbaruItem = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string | null;
    gambar_sampul: string | null;
    status: 'draft' | 'terbit';
    penulis: { id: number; name: string } | null;
    diterbitkan_pada: string | null;
};

type WishPendingItem = {
    id: number;
    nama_tampil: string;
    pesan: string;
    jumlah_laporan: number;
    waktu_relatif: string;
};

type StrukturOrganisasiItem = {
    id: number;
    nama_divisi: string;
    deskripsi: string | null;
    jumlah_pengurus: number;
};

type Props = {
    stats: PengurusStats | AnggotaStats;
    kegiatanMendatang: SesiMendatang[];
    kegiatanTerbaru?: KegiatanTerbaruItem[];
    rekapKehadiran?: RekapMember[];
    aktivitasTerbaru?: AktivitasItem[];
    tugasSaya?: TugasItem[];
    artikelTerbaru?: ArtikelTerbaruItem[];
    wishesPending?: WishPendingItem[];
    strukturOrganisasi?: StrukturOrganisasiItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Stat Card Component ──────────────────────────────────────────────────────

function DashboardStatCard({
    label,
    value,
    icon: Icon,
    iconBg,
    iconColor,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(74,95,209,0.08)] dark:border-slate-700/80 dark:from-[#181E2B] dark:via-[#181E2B] dark:to-[#1E2430]">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[#4A5FD1] via-[#7C8AF7] to-[#2E9E82] opacity-90" />
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        {label}
                    </p>
                </div>
                <div
                    className={`flex size-10 items-center justify-center rounded-xl border border-white/30 ${iconBg} shadow-inner`}
                >
                    <Icon className={`size-4 ${iconColor}`} />
                </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
                <p className="font-mono-sigap text-3xl font-semibold tracking-[-0.05em] text-[#1E2430] dark:text-[#E6ECF5]">
                    {value}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-medium tracking-[0.14em] text-[#727C8E] uppercase dark:bg-slate-800 dark:text-[#8C97A8]">
                    Live
                </span>
            </div>
        </div>
    );
}

// ─── Pengurus Dashboard ───────────────────────────────────────────────────────

function PengurusDashboard({
    stats,
    kegiatanMendatang = [],
    kegiatanTerbaru = [],
    artikelTerbaru = [],
    wishesPending = [],
    strukturOrganisasi = [],
}: {
    stats: PengurusStats;
    kegiatanMendatang: SesiMendatang[];
    kegiatanTerbaru?: KegiatanTerbaruItem[];
    artikelTerbaru?: ArtikelTerbaruItem[];
    wishesPending?: WishPendingItem[];
    strukturOrganisasi?: StrukturOrganisasiItem[];
}) {
    const { auth, currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const firstName = auth.user.name.split(' ')[0];

    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(
        null,
    );

    const statCards = [
        {
            label: 'Total Proyek & Kegiatan',
            value: stats.totalKegiatan,
            icon: Calendar,
            iconBg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
            iconColor: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        },
        {
            label: 'Anggota & Tim',
            value: stats.totalAnggota,
            icon: Users,
            iconBg: 'bg-[#727C8E]/12 dark:bg-[#727C8E]/20',
            iconColor: 'text-[#727C8E] dark:text-[#8C97A8]',
        },
        {
            label: 'Total Presensi',
            value: stats.totalPresensi,
            icon: ClipboardCheck,
            iconBg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
            iconColor: 'text-[#2E9E82] dark:text-[#34B394]',
        },
        {
            label: 'Kegiatan Aktif',
            value: stats.kegiatanAktif,
            icon: TrendingUp,
            iconBg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
            iconColor: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        },
        {
            label: 'Total Artikel',
            value: stats.totalArtikel,
            icon: Newspaper,
            iconBg: 'bg-blue-100 dark:bg-blue-950/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Wishes Pending',
            value: stats.wishesPending,
            icon: Sparkles,
            iconBg: 'bg-pink-100 dark:bg-pink-950/40',
            iconColor: 'text-pink-600 dark:text-pink-400',
        },
        {
            label: 'Total Divisi',
            value: stats.totalDivisi,
            icon: Building2,
            iconBg: 'bg-cyan-100 dark:bg-cyan-950/40',
            iconColor: 'text-cyan-600 dark:text-cyan-400',
        },
    ];

    return (
        <>
            <div className="flex h-full flex-1 flex-col gap-6 p-5 sm:p-6 lg:p-8">
                {/* ── Greeting & Top Status ── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-[#F5F7FF] via-white to-[#ECFDF7] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-slate-700/80 dark:from-[#1B2330] dark:via-[#181E2B] dark:to-[#1B2330]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-2xl dark:text-[#E6ECF5]">
                                    Halo, {firstName}
                                </h1>
                                {stats.kegiatanAktif > 0 && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4A5FD1]/12 px-2.5 py-1 text-[11px] font-medium text-[#4A5FD1] ring-1 ring-[#4A5FD1]/10 ring-inset dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                        <SigapPulse />
                                        {stats.kegiatanAktif} proyek aktif
                                    </span>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Ringkasan performa tim dan timeline proyek hari
                                ini.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#4A5FD1]/20 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[#4A5FD1] backdrop-blur-sm dark:border-[#8FA0FA]/20 dark:bg-[#1F2937]/80 dark:text-[#8FA0FA]">
                            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            Sistem berjalan lancar
                        </div>
                    </div>
                </div>

                {/* ── Stat Cards Row ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <DashboardStatCard key={card.label} {...card} />
                    ))}
                </div>

                {/* ── Two Large Content Cards ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* 1. Kegiatan / Sesi Akan Datang */}
                    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.03)] dark:border-slate-700/80 dark:bg-[#181E2B]">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Jadwal Sesi Mendatang
                                </h2>
                                <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    Sesi dan tenggat waktu dalam 1 tahun ke
                                    depan
                                </p>
                            </div>
                            <Link
                                href={
                                    teamSlug
                                        ? kalenderIndex.url(teamSlug)
                                        : '/kalender'
                                }
                                className="rounded-full bg-[#4A5FD1]/8 px-2.5 py-1 text-xs font-medium text-[#4A5FD1] transition hover:bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/12 dark:text-[#8FA0FA]"
                            >
                                Lihat semua →
                            </Link>
                        </div>

                        {kegiatanMendatang.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="size-6 text-[#727C8E]/50 dark:text-[#8C97A8]/50" />
                                <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Belum ada sesi kegiatan dalam 1 tahun ke
                                    depan.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-col divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                {kegiatanMendatang.map((sesi) => (
                                    <div
                                        key={sesi.id}
                                        onClick={() =>
                                            setSelectedKegiatanId(
                                                sesi.kegiatanId,
                                            )
                                        }
                                        className="group -mx-2 flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-3 transition hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]/50"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            setSelectedKegiatanId(
                                                sesi.kegiatanId,
                                            )
                                        }
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                className="h-7 w-1 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        sesi.warna ?? '#4A5FD1',
                                                }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                                    {sesi.kegiatanNama}
                                                </p>
                                                <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                    {formatTanggal(
                                                        sesi.tanggal,
                                                    )}{' '}
                                                    •{' '}
                                                    {sesi.waktuMulai.slice(
                                                        0,
                                                        5,
                                                    )}{' '}
                                                    WIB
                                                </p>
                                            </div>
                                        </div>

                                        <StatusStiker
                                            status={sesi.status}
                                            label={
                                                sesi.status === 'berlangsung'
                                                    ? 'Berlangsung'
                                                    : 'Akan Datang'
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Proyek & Kegiatan Terbaru */}
                    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.03)] dark:border-slate-700/80 dark:bg-[#181E2B]">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
                            <div>
                                <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    Proyek & Kegiatan Terbaru
                                </h2>
                                <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    Daftar proyek aktif tim Anda
                                </p>
                            </div>
                            <Link
                                href={
                                    teamSlug
                                        ? pengurus.kegiatan.index.url(teamSlug)
                                        : '/pengurus/kegiatan'
                                }
                                className="rounded-full bg-[#4A5FD1]/8 px-2.5 py-1 text-xs font-medium text-[#4A5FD1] transition hover:bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/12 dark:text-[#8FA0FA]"
                            >
                                Kelola semua →
                            </Link>
                        </div>

                        {kegiatanTerbaru.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ClipboardList className="size-6 text-[#727C8E]/50 dark:text-[#8C97A8]/50" />
                                <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Belum ada proyek atau kegiatan.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-col divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                {kegiatanTerbaru.map((kg) => {
                                    const eventColor = kg.warna ?? '#4A5FD1';

                                    return (
                                        <div
                                            key={kg.id}
                                            onClick={() =>
                                                setSelectedKegiatanId(kg.id)
                                            }
                                            className="group -mx-2 flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-3 transition hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]/50"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) =>
                                                e.key === 'Enter' &&
                                                setSelectedKegiatanId(kg.id)
                                            }
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div
                                                    className="flex size-7.5 shrink-0 items-center justify-center rounded-md"
                                                    style={{
                                                        backgroundColor: `${eventColor}18`,
                                                    }}
                                                >
                                                    <Calendar
                                                        className="size-3.5"
                                                        style={{
                                                            color: eventColor,
                                                        }}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                                        {kg.nama}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-[#727C8E] capitalize dark:text-[#8C97A8]">
                                                        {kg.tipe === 'terbuka'
                                                            ? 'Proyek Terbuka'
                                                            : 'Wajib Hadir'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className="text-[11px] font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                                Buka Detail →
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Slide-in Detail Kegiatan */}
            {selectedKegiatanId && (
                <EventDetailCard
                    kegiatanId={selectedKegiatanId}
                    onClose={() => setSelectedKegiatanId(null)}
                />
            )}
        </>
    );
}

// ─── Anggota Dashboard ────────────────────────────────────────────────────────

function AnggotaDashboard({
    stats,
    kegiatanMendatang,
    aktivitasTerbaru,
}: {
    stats: AnggotaStats;
    kegiatanMendatang: SesiMendatang[];
    aktivitasTerbaru?: AktivitasItem[];
    tugasSaya?: TugasItem[];
}) {
    const { auth, currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const firstName = auth.user.name.split(' ')[0];

    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(
        null,
    );

    const statCards = [
        {
            label: 'Total Kehadiran Saya',
            value: stats.totalKehadiran,
            icon: CalendarCheck2,
            iconBg: 'bg-[#2E9E82]/12 dark:bg-[#2E9E82]/20',
            iconColor: 'text-[#2E9E82] dark:text-[#34B394]',
        },
        {
            label: 'RSVP / Registrasi Aktif',
            value: stats.rsvpAktif,
            icon: ClipboardList,
            iconBg: 'bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/20',
            iconColor: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
        },
    ];

    return (
        <>
            <div className="flex h-full flex-1 flex-col gap-6 p-5 sm:p-6 lg:p-8">
                {/* ── Greeting ── */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-[#EEF2FF] via-white to-[#F0FDF4] p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)] dark:border-slate-700/80 dark:from-[#1B2330] dark:via-[#181E2B] dark:to-[#1B2330]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-2xl dark:text-[#E6ECF5]">
                                Halo, {firstName}
                            </h1>
                            <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Cek kegiatan mendatang, isi presensi, dan pantau
                                keaktifan Anda di sini.
                            </p>
                        </div>
                        <Link
                            href={
                                teamSlug
                                    ? riwayatSayaIndex.url(teamSlug)
                                    : '/riwayat-saya'
                            }
                            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#4A5FD1] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(74,95,209,0.2)] transition hover:bg-[#3B4DB8]"
                        >
                            <CalendarCheck2 className="size-3.5" />
                            <span>Riwayat Saya</span>
                        </Link>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((card) => (
                        <DashboardStatCard key={card.label} {...card} />
                    ))}
                </div>

                {/* ── Content Row ── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Kegiatan Akan Datang */}
                    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.03)] dark:border-slate-700/80 dark:bg-[#181E2B]">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-700/80">
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Kegiatan Akan Datang
                            </h2>
                            <Link
                                href={
                                    teamSlug
                                        ? kalenderIndex.url(teamSlug)
                                        : '/kalender'
                                }
                                className="rounded-full bg-[#4A5FD1]/8 px-2.5 py-1 text-xs font-medium text-[#4A5FD1] transition hover:bg-[#4A5FD1]/12 dark:bg-[#4A5FD1]/12 dark:text-[#8FA0FA]"
                            >
                                Lihat semua →
                            </Link>
                        </div>

                        {kegiatanMendatang.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="size-6 text-[#727C8E]/50 dark:text-[#8C97A8]/50" />
                                <p className="mt-2 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                    Tidak ada kegiatan dalam waktu dekat.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-col divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                {kegiatanMendatang.map((sesi) => (
                                    <div
                                        key={sesi.id}
                                        onClick={() =>
                                            setSelectedKegiatanId(
                                                sesi.kegiatanId,
                                            )
                                        }
                                        className="group -mx-2 flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-3 transition hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]/50"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            setSelectedKegiatanId(
                                                sesi.kegiatanId,
                                            )
                                        }
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                className="h-7 w-1 shrink-0 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        sesi.warna ?? '#4A5FD1',
                                                }}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                                    {sesi.kegiatanNama}
                                                </p>
                                                <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                    {formatTanggal(
                                                        sesi.tanggal,
                                                    )}{' '}
                                                    •{' '}
                                                    {sesi.waktuMulai.slice(
                                                        0,
                                                        5,
                                                    )}{' '}
                                                    WIB
                                                </p>
                                            </div>
                                        </div>

                                        <StatusStiker
                                            status={sesi.status}
                                            label={
                                                sesi.status === 'berlangsung'
                                                    ? 'Berlangsung'
                                                    : 'Akan Datang'
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Presensi Terakhir Saya */}
                    {aktivitasTerbaru && aktivitasTerbaru.length > 0 && (
                        <div className="flex flex-col rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <h2 className="border-b border-[rgba(30,36,48,0.08)] pb-4 font-display text-base font-semibold text-[#1E2430] dark:border-[rgba(255,255,255,0.08)] dark:text-[#E6ECF5]">
                                Presensi Terakhir Saya
                            </h2>
                            <div className="mt-4 flex flex-col divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                {aktivitasTerbaru.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex min-h-[48px] items-center gap-3 py-3"
                                    >
                                        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                            <CheckCircle2 className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                {item.kegiatanNama}
                                            </p>
                                            <p className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                {new Date(
                                                    item.waktu,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-in Detail Kegiatan */}
            {selectedKegiatanId && (
                <EventDetailCard
                    kegiatanId={selectedKegiatanId}
                    onClose={() => setSelectedKegiatanId(null)}
                />
            )}
        </>
    );
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function Dashboard({
    stats,
    kegiatanMendatang,
    kegiatanTerbaru,
    rekapKehadiran,
    aktivitasTerbaru,
    tugasSaya,
    artikelTerbaru,
    wishesPending,
    strukturOrganisasi,
}: Props) {
    const { auth } = usePage().props;
    const isPengurus = auth.user.role === 'pengurus';

    return (
        <>
            <Head title="Dashboard" />
            {isPengurus ? (
                <PengurusDashboard
                    stats={stats as PengurusStats}
                    kegiatanMendatang={kegiatanMendatang}
                    kegiatanTerbaru={kegiatanTerbaru}
                    artikelTerbaru={artikelTerbaru}
                    wishesPending={wishesPending}
                    strukturOrganisasi={strukturOrganisasi}
                />
            ) : (
                <AnggotaDashboard
                    stats={stats as AnggotaStats}
                    kegiatanMendatang={kegiatanMendatang}
                    aktivitasTerbaru={aktivitasTerbaru}
                    tugasSaya={tugasSaya}
                />
            )}
        </>
    );
}

Dashboard.layout = (props: {
    currentTeam?: { slug: string } | null;
    auth?: { user?: { role?: string } };
}) => ({
    breadcrumbs: kegiatanBreadcrumbs(
        'Dashboard',
        props.currentTeam
            ? props.auth?.user?.role === 'pengurus'
                ? pengurusDashboard.url(props.currentTeam.slug)
                : anggotaDashboard.url(props.currentTeam.slug)
            : '/',
    ),
});
