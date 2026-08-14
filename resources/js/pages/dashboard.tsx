import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarCheck2,
    ClipboardList,
    Clock,
    MapPin,
    Users,
} from 'lucide-react';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus from '@/routes/pengurus';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import { show as kegiatanShow } from '@/routes/kegiatan';

// â”€â”€â”€ Shared types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SesiMendatang = {
    id: number;
    kegiatanId: number;
    kegiatanNama: string;
    warna: string | null;
    tanggal: string;
    waktuMulai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
};

type PengurusStats = {
    totalKegiatan: number;
    totalAnggota: number;
    totalSesiSelesai: number;
};

type AnggotaStats = {
    totalKehadiran: number;
    rsvpAktif: number;
};

type Props = {
    stats: PengurusStats | AnggotaStats;
    kegiatanMendatang: SesiMendatang[];
};

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function formatTanggal(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function StatusBadge({ status }: { status: SesiMendatang['status'] }) {
    const map = {
        terjadwal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        berlangsung: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        selesai: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    };
    const label = { terjadwal: 'Terjadwal', berlangsung: 'Berlangsung', selesai: 'Selesai' };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
            {label[status]}
        </span>
    );
}

function KegiatanMendatangCard({ items, teamSlug }: { items: SesiMendatang[]; teamSlug: string }) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-white p-5 dark:border-sidebar-border dark:bg-neutral-900">
            <div className="mb-4 flex items-center gap-2">
                <Calendar className="size-4 text-neutral-500" />
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Kegiatan Mendatang
                </h3>
                <span className="ml-auto text-xs text-neutral-400">30 hari ke depan</span>
            </div>

            {items.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                    Tidak ada kegiatan dalam 30 hari ke depan.
                </p>
            ) : (
                <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {items.map((sesi) => (
                        <li key={sesi.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                            <span
                                className="mt-0.5 size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-neutral-900"
                                style={{ backgroundColor: sesi.warna ?? '#6366f1' }}
                            />
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={kegiatanShow.url({ current_team: teamSlug, kegiatan: sesi.kegiatanId })}
                                    className="truncate text-sm font-medium text-neutral-800 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                                >
                                    {sesi.kegiatanNama}
                                </Link>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3" />
                                        {formatTanggal(sesi.tanggal)} Â· {sesi.waktuMulai.slice(0, 5)}
                                    </span>
                                    {sesi.lokasi && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {sesi.lokasi}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <StatusBadge status={sesi.status} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// â”€â”€â”€ Pengurus dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PengurusDashboard({ stats, kegiatanMendatang }: { stats: PengurusStats; kegiatanMendatang: SesiMendatang[] }) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const statCards = [
        {
            label: 'Total Kegiatan',
            value: stats.totalKegiatan,
            icon: ClipboardList,
            color: 'from-violet-500 to-indigo-500',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
            text: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Total Anggota',
            value: stats.totalAnggota,
            icon: Users,
            color: 'from-sky-500 to-cyan-500',
            bg: 'bg-sky-50 dark:bg-sky-950/30',
            text: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Sesi Telah Selesai',
            value: stats.totalSesiSelesai,
            icon: CalendarCheck2,
            color: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-5 p-4">
            {/* Welcome banner */}
            <div className="rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-6 text-white shadow-sm">
                <p className="text-sm font-medium opacity-80">Panel Pengurus</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">Selamat datang kembali!</h2>
                <p className="mt-1 text-sm opacity-70">
                    Kelola kegiatan, pantau kehadiran anggota, dan susun laporan dari sini.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={pengurus.kegiatan.create.url(teamSlug)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                    >
                        <ClipboardList className="size-4" />
                        Buat Kegiatan
                    </Link>
                    <Link
                        href={pengurus.anggota.index.url(teamSlug)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                    >
                        <Users className="size-4" />
                        Kelola Anggota
                    </Link>
                    <Link
                        href={kalenderIndex.url(teamSlug)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                    >
                        <Calendar className="size-4" />
                        Lihat Kalender
                    </Link>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className={`flex items-center gap-4 rounded-xl border border-sidebar-border/70 ${card.bg} p-5 dark:border-sidebar-border`}
                    >
                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-sm`}>
                            <card.icon className="size-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {card.value}
                            </p>
                            <p className={`text-xs font-medium ${card.text}`}>{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kegiatan mendatang */}
            <KegiatanMendatangCard items={kegiatanMendatang} teamSlug={teamSlug} />
        </div>
    );
}

// â”€â”€â”€ Anggota dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AnggotaDashboard({ stats, kegiatanMendatang }: { stats: AnggotaStats; kegiatanMendatang: SesiMendatang[] }) {
    const { auth, currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const statCards = [
        {
            label: 'Total Kehadiran Saya',
            value: stats.totalKehadiran,
            icon: CalendarCheck2,
            color: 'from-emerald-500 to-teal-500',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'RSVP Aktif',
            value: stats.rsvpAktif,
            icon: ClipboardList,
            color: 'from-amber-500 to-orange-500',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            text: 'text-amber-600 dark:text-amber-400',
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-5 p-4">
            {/* Welcome banner */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-sm">
                <p className="text-sm font-medium opacity-80">Portal Anggota</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    Halo, {auth.user.name.split(' ')[0]}!
                </h2>
                <p className="mt-1 text-sm opacity-70">
                    Cek kegiatan mendatang, isi presensi, dan pantau keaktifanmu di sini.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={teamSlug ? kalenderIndex.url(teamSlug) : '/kalender'}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                    >
                        <Calendar className="size-4" />
                        Lihat Kalender
                    </Link>
                    <Link
                        href={teamSlug ? riwayatSayaIndex.url(teamSlug) : '/riwayat-saya'}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/30"
                    >
                        <CalendarCheck2 className="size-4" />
                        Riwayat Saya
                    </Link>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className={`flex items-center gap-4 rounded-xl border border-sidebar-border/70 ${card.bg} p-5 dark:border-sidebar-border`}
                    >
                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-sm`}>
                            <card.icon className="size-5 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
                                {card.value}
                            </p>
                            <p className={`text-xs font-medium ${card.text}`}>{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kegiatan mendatang */}
            <KegiatanMendatangCard items={kegiatanMendatang} teamSlug={teamSlug} />
        </div>
    );
}

// â”€â”€â”€ Root page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Dashboard({ stats, kegiatanMendatang }: Props) {
    const { auth } = usePage().props;
    const isPengurus = auth.user.role === 'pengurus';

    return (
        <>
            <Head title="Dashboard" />
            {isPengurus ? (
                <PengurusDashboard
                    stats={stats as PengurusStats}
                    kegiatanMendatang={kegiatanMendatang}
                />
            ) : (
                <AnggotaDashboard
                    stats={stats as AnggotaStats}
                    kegiatanMendatang={kegiatanMendatang}
                />
            )}
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null; auth?: { user?: { role?: string } } }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? props.auth?.user?.role === 'pengurus'
                    ? pengurusDashboard.url(props.currentTeam.slug)
                    : anggotaDashboard.url(props.currentTeam.slug)
                : '/',
        },
    ],
});
