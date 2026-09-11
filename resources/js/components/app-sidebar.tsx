import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    ClipboardList,
    Compass,
    FileImage,
    FileText,
    History,
    LayoutGrid,
    LogOut,
    Mail,
    Monitor,
    Moon,
    Newspaper,
    Settings,
    Sparkles,
    Star,
    Sun,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { TeamSwitcher } from '@/components/team-switcher';
import { PeriodeSwitcher } from '@/components/periode-switcher';
import { useAppearance } from '@/hooks/use-appearance';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus, { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as anggaranIdx } from '@/routes/anggaran';
import { index as panitiaIdx } from '@/routes/panitia';
import { index as dokumentasiIdx } from '@/routes/dokumentasi';
import { index as evaluasiIdx } from '@/routes/evaluasi';
import { index as laporanIndex } from '@/routes/pengurus/laporan';
import { index as rundownIdx } from '@/routes/rundown';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import { index as suratIndex } from '@/routes/surat';
import { logout } from '@/routes';
import { edit as editProfile } from '@/routes/profile';

// ─── Mini Calendar (Sidebar Widget) ───────────────────────────────────────────

const BULAN_ID = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const HARI_PENDEK = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

function SidebarMiniCalendar({ teamSlug }: { teamSlug: string }) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else {
            setViewMonth((m) => m - 1);
        }
    };

    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else {
            setViewMonth((m) => m + 1);
        }
    };

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <SidebarGroup className="px-3 py-2 group-data-[collapsible=icon]:hidden">
            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] p-3 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]">
                {/* Month nav */}
                <div className="mb-2 flex items-center justify-between">
                    <button
                        onClick={prevMonth}
                        type="button"
                        className="flex size-5.5 items-center justify-center rounded-md text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                        aria-label="Bulan sebelumnya"
                    >
                        <ChevronLeft className="size-3.5" />
                    </button>
                    <span className="font-display text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        {BULAN_ID[viewMonth].slice(0, 3)} {viewYear}
                    </span>
                    <button
                        onClick={nextMonth}
                        type="button"
                        className="flex size-5.5 items-center justify-center rounded-md text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                        aria-label="Bulan berikutnya"
                    >
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="mb-1 grid grid-cols-7">
                    {HARI_PENDEK.map((h, i) => (
                        <div
                            key={i}
                            className="text-center text-[9px] font-semibold text-[#727C8E] uppercase dark:text-[#8C97A8]"
                        >
                            {h}
                        </div>
                    ))}
                </div>

                {/* Date grid */}
                <div className="grid grid-cols-7 gap-y-0.5">
                    {cells.map((day, idx) => {
                        if (!day) return <div key={`e-${idx}`} />;
                        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = dateStr === todayStr;

                        return (
                            <div
                                key={dateStr}
                                className={`font-mono-sigap mx-auto flex size-5.5 items-center justify-center rounded-md text-[10px] font-medium transition ${
                                    isToday
                                        ? 'bg-[#4A5FD1] font-semibold text-white'
                                        : 'text-[#1E2430] hover:bg-white dark:text-[#E6ECF5] dark:hover:bg-[#181E2B]'
                                }`}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>

                {/* Link to full calendar */}
                <Link
                    href={kalenderIndex.url(teamSlug)}
                    prefetch
                    className="mt-2.5 flex items-center justify-center rounded-md border border-[rgba(30,36,48,0.08)] bg-white py-1 text-[11px] font-semibold text-[#4A5FD1] transition hover:bg-[#4A5FD1] hover:text-white dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:text-[#8FA0FA] dark:hover:bg-[#4A5FD1] dark:hover:text-white"
                >
                    Kalender Penuh →
                </Link>
            </div>
        </SidebarGroup>
    );
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
    const page = usePage();
    const user = (page.props as any).auth?.user;
    const isPengurus =
        user?.role === 'pengurus' ||
        user?.role === 'super_admin' ||
        user?.role === 'pembina';
    const teamSlug = page.props.currentTeam?.slug;
    const { appearance, resolvedAppearance, updateAppearance } =
        useAppearance();

    const dashboardUrl = teamSlug
        ? isPengurus
            ? pengurusDashboard.url(teamSlug)
            : anggotaDashboard.url(teamSlug)
        : '/';

    const initials = user?.name
        ? user.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
        : 'U';

    const pengurusNavGroups = [
        {
            title: 'Menu Utama',
            items: [
                {
                    title: 'Dashboard',
                    href: dashboardUrl,
                    icon: LayoutGrid,
                },
                {
                    title: 'Kalender',
                    href: teamSlug ? kalenderIndex.url(teamSlug) : '/',
                    icon: Calendar,
                },
                {
                    title: 'Proyek & Kegiatan',
                    href: teamSlug
                        ? pengurus.kegiatan.index.url(teamSlug)
                        : '/',
                    icon: ClipboardList,
                },
            ],
        },
        {
            title: 'Manajemen Acara',
            items: [
                {
                    title: 'Panitia & Tugas',
                    href: teamSlug ? panitiaIdx.url(teamSlug) : '/',
                    icon: Users,
                },
                {
                    title: 'Susunan Rundown',
                    href: teamSlug ? rundownIdx.url(teamSlug) : '/',
                    icon: ClipboardList,
                },
                {
                    title: 'Anggaran Biaya',
                    href: teamSlug ? anggaranIdx.url(teamSlug) : '/',
                    icon: CircleDollarSign,
                },
                {
                    title: 'Dokumentasi',
                    href: teamSlug ? dokumentasiIdx.url(teamSlug) : '/',
                    icon: FileImage,
                },
                {
                    title: 'Evaluasi',
                    href: teamSlug ? evaluasiIdx.url(teamSlug) : '/',
                    icon: Star,
                },
                {
                    title: 'Surat Menyurat',
                    href: teamSlug ? suratIndex.url(teamSlug) : '/',
                    icon: Mail,
                },
            ],
        },
        {
            title: 'Administrasi & Laporan',
            items: [
                {
                    title: 'Kelola Tim & Anggota',
                    href: teamSlug ? pengurus.anggota.index.url(teamSlug) : '/',
                    icon: UserCheck,
                },
                {
                    title: 'Artikel & Berita',
                    href: teamSlug ? `/${teamSlug}/pengurus/artikel` : '/',
                    icon: Newspaper,
                },
                {
                    title: 'Moderasi Wish Wall',
                    href: teamSlug ? `/${teamSlug}/pengurus/wish-wall` : '/',
                    icon: Sparkles,
                },
                {
                    title: 'Struktur Organisasi',
                    href: teamSlug
                        ? `/${teamSlug}/pengurus/struktur-organisasi`
                        : '/',
                    icon: Building2,
                },
                {
                    title: 'Visi & Misi',
                    href: teamSlug ? pengurus.visiMisi.index.url(teamSlug) : '/',
                    icon: Compass,
                },
                {
                    title: 'Laporan Rekap',
                    href: teamSlug ? laporanIndex.url(teamSlug) : '/',
                    icon: FileText,
                },
            ],
        },
    ];

    const anggotaNavGroups = [
        {
            title: 'Menu Utama',
            items: [
                {
                    title: 'Dashboard',
                    href: dashboardUrl,
                    icon: LayoutGrid,
                },
                {
                    title: 'Kalender Acara',
                    href: teamSlug ? kalenderIndex.url(teamSlug) : '/',
                    icon: Calendar,
                },
                {
                    title: 'Riwayat Saya',
                    href: teamSlug
                        ? riwayatSayaIndex.url(teamSlug)
                        : '/riwayat-saya',
                    icon: History,
                },
            ],
        },
        {
            title: 'Operasional Kegiatan',
            items: [
                {
                    title: 'Panitia & Tugas',
                    href: teamSlug ? panitiaIdx.url(teamSlug) : '/',
                    icon: Users,
                },
                {
                    title: 'Rundown Acara',
                    href: teamSlug ? rundownIdx.url(teamSlug) : '/',
                    icon: ClipboardList,
                },
                {
                    title: 'Anggaran',
                    href: teamSlug ? anggaranIdx.url(teamSlug) : '/',
                    icon: CircleDollarSign,
                },
                {
                    title: 'Dokumentasi',
                    href: teamSlug ? dokumentasiIdx.url(teamSlug) : '/',
                    icon: FileImage,
                },
                {
                    title: 'Evaluasi',
                    href: teamSlug ? evaluasiIdx.url(teamSlug) : '/',
                    icon: Star,
                },
            ],
        },
    ];

    return (
        <Sidebar
            collapsible="icon"
            className="border-r border-[rgba(30,36,48,0.08)] bg-white dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
        >
            {/* Header / Logo + Team Switcher */}
            <SidebarHeader className="flex flex-col gap-2 p-3.5 pb-2">
                <Link href={dashboardUrl} className="flex items-center">
                    <AppLogo />
                </Link>
                <div className="mt-0.5 flex flex-col gap-1">
                    <TeamSwitcher />
                    <PeriodeSwitcher />
                </div>
            </SidebarHeader>

            {/* Navigation items & Mini Calendar */}
            <SidebarContent className="py-1">
                <NavMain
                    groups={isPengurus ? pengurusNavGroups : anggotaNavGroups}
                />

                {/* Mini calendar widget */}
                {teamSlug && <SidebarMiniCalendar teamSlug={teamSlug} />}
            </SidebarContent>

            {/* Footer with Dark Mode Toggle, User info & Actions */}
            <SidebarFooter className="border-t border-[rgba(30,36,48,0.08)] p-3 dark:border-[rgba(255,255,255,0.08)]">
                <div className="flex flex-col gap-2">
                    {/* Dark Mode Theme Switcher */}
                    <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] p-1 group-data-[collapsible=icon]:hidden dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]">
                        <div className="flex items-center justify-between px-1.5 py-0.5">
                            <span className="text-[11px] font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                                Mode Tema
                            </span>
                            <div className="flex items-center gap-0.5 rounded-md bg-white p-0.5 shadow-none dark:bg-[#181E2B]">
                                <button
                                    type="button"
                                    onClick={() => updateAppearance('light')}
                                    className={`flex size-5.5 items-center justify-center rounded-sm transition-all ${
                                        appearance === 'light'
                                            ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                            : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                    }`}
                                    title="Terang"
                                >
                                    <Sun className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateAppearance('dark')}
                                    className={`flex size-5.5 items-center justify-center rounded-sm transition-all ${
                                        appearance === 'dark'
                                            ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                            : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                    }`}
                                    title="Gelap"
                                >
                                    <Moon className="size-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateAppearance('system')}
                                    className={`flex size-5.5 items-center justify-center rounded-sm transition-all ${
                                        appearance === 'system'
                                            ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                            : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                    }`}
                                    title="Sistem"
                                >
                                    <Monitor className="size-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible icon-only mode toggle */}
                    <button
                        type="button"
                        onClick={() =>
                            updateAppearance(
                                resolvedAppearance === 'dark'
                                    ? 'light'
                                    : 'dark',
                            )
                        }
                        className="mx-auto hidden size-8 items-center justify-center rounded-lg border border-[rgba(30,36,48,0.08)] bg-white text-[#727C8E] group-data-[collapsible=icon]:flex hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A] dark:text-[#8C97A8]"
                        title={
                            resolvedAppearance === 'dark'
                                ? 'Beralih ke Mode Terang'
                                : 'Beralih ke Mode Gelap'
                        }
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Sun className="size-3.5 text-[#B8862E]" />
                        ) : (
                            <Moon className="size-3.5 text-[#4A5FD1]" />
                        )}
                    </button>

                    {/* User profile with link to profile settings */}
                    <Link
                        href={editProfile()}
                        className="group flex items-center gap-2.5 rounded-lg p-1.5 transition hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                    >
                        <div className="flex size-7.5 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1] text-xs font-semibold text-white">
                            {initials}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-xs font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                {user?.name ?? 'Tamu'}
                            </span>
                            <span className="truncate text-[11px] text-[#727C8E] capitalize dark:text-[#8C97A8]">
                                {user?.role ?? 'Pengunjung'}
                            </span>
                        </div>
                        <Settings className="size-3.5 text-[#727C8E] transition group-hover:text-[#1E2430] dark:text-[#8C97A8] dark:group-hover:text-[#E6ECF5]" />
                    </Link>

                    {/* Logout button */}
                    <Link
                        href={logout()}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-[#C4514A] transition hover:bg-[#C4514A]/10 dark:hover:bg-[#C4514A]/20"
                    >
                        <LogOut className="size-3.5" />
                        <span>Keluar</span>
                    </Link>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

export default AppSidebar;
