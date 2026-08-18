import { Head } from '@inertiajs/react';
import { Globe, LayoutGrid, Users } from 'lucide-react';

type TeamItem = {
    id: number;
    name: string;
    slug: string;
    members_count: number;
    kegiatan_count: number;
};

type UserItem = {
    id: number;
    name: string;
    email: string;
    global_role: string;
    created_at: string;
};

type Props = {
    stats: {
        totalTeam: number;
        totalUser: number;
        totalKegiatan: number;
    };
    teams: TeamItem[];
    userTerbaru: UserItem[];
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SuperAdminDashboard({ stats, teams, userTerbaru }: Props) {
    const statCards = [
        { label: 'Total Team', value: stats.totalTeam, icon: Globe, color: 'from-violet-500 to-indigo-500', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400' },
        { label: 'Total User', value: stats.totalUser, icon: Users, color: 'from-sky-500 to-cyan-500', bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600 dark:text-sky-400' },
        { label: 'Total Kegiatan', value: stats.totalKegiatan, icon: LayoutGrid, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
    ];

    return (
        <>
            <Head title="Super Admin Dashboard" />
            <div className="mx-auto max-w-5xl p-4 md:p-6">
                {/* Header */}
                <div className="mb-6 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 p-6 text-white shadow-sm">
                    <p className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">Super Admin</p>
                    <h1 className="mt-1 text-2xl font-bold">Dashboard Sistem</h1>
                    <p className="mt-1 text-sm text-neutral-400">Overview lintas-team untuk keperluan maintenance sistem.</p>
                </div>

                {/* Stat cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    {statCards.map(card => (
                        <div key={card.label} className={`flex items-center gap-4 rounded-xl border border-sidebar-border/70 ${card.bg} p-5 dark:border-sidebar-border`}>
                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} shadow-sm`}>
                                <card.icon className="size-5 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">{card.value}</p>
                                <p className={`text-xs font-medium ${card.text}`}>{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Teams */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Team ({teams.length} ditampilkan)
                        </h2>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {teams.map(team => (
                                <div key={team.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{team.name}</p>
                                        <p className="text-xs text-neutral-400">{team.slug}</p>
                                    </div>
                                    <div className="flex gap-4 text-right text-xs text-neutral-500">
                                        <span>{team.members_count} anggota</span>
                                        <span>{team.kegiatan_count} kegiatan</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* User terbaru */}
                    <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                            Registrasi Terbaru
                        </h2>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {userTerbaru.map(user => (
                                <div key={user.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{user.name}</p>
                                        <p className="truncate text-xs text-neutral-400">{user.email}</p>
                                    </div>
                                    <div className="text-right text-xs text-neutral-400">
                                        <p className={user.global_role === 'super_admin' ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>{user.global_role}</p>
                                        <p>{formatDate(user.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
