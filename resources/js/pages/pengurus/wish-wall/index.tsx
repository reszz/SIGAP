import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Eye,
    EyeOff,
    Filter,
    Flag,
    MessageSquare,
    Search,
    Shield,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { confirmDelete, showSuccess } from '@/lib/sweetalert';
import { toggleStatus, destroy } from '@/routes/pengurus/wish-wall';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';
import AnggotaIndex from '@/pages/pengurus/anggota';
import ReadOnlyBanner from '@/components/read-only-banner';

// ─── Types ────────────────────────────────────────────────────────────────────

type WishItem = {
    id: number;
    nama_pengirim: string | null;
    nama_tampil: string;
    pesan: string;
    status: 'tampil' | 'disembunyikan';
    jumlah_laporan: number;
    waktu_relatif: string;
    created_at: string;
};

type PaginatedWishes = {
    data: WishItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Stats = {
    total: number;
    tampil: number;
    disembunyikan: number;
    dilaporkan: number;
};

type Props = {
    wishes: PaginatedWishes;
    stats: Stats;
    filters: {
        status?: string;
        cari?: string;
    };
    canManage?: boolean;
    isReadOnly?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PengurusWishWallIndex({
    wishes,
    stats,
    filters,
    canManage = true,
    isReadOnly = false,
}: Props) {
    const { url, props } = usePage<any>();
    const teamSlug = url.split('/')[1];
    const auth = props?.auth;

    const [statusFilter, setStatusFilter] = useState(filters.status || 'semua');
    const [searchQuery, setSearchQuery] = useState(filters.cari || '');

    function handleFilterChange(newStatus: string) {
        setStatusFilter(newStatus);
        router.get(
            `/${teamSlug}/pengurus/wish-wall`,
            {
                status: newStatus === 'semua' ? undefined : newStatus,
                cari: searchQuery || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        router.get(
            `/${teamSlug}/pengurus/wish-wall`,
            {
                status: statusFilter === 'semua' ? undefined : statusFilter,
                cari: searchQuery || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleClearSearch() {
        setSearchQuery('');
        router.get(
            `/${teamSlug}/pengurus/wish-wall`,
            {
                status: statusFilter === 'semua' ? undefined : statusFilter,
            },
            { preserveState: true, replace: true },
        );
    }

    function handleToggleStatus(wish: WishItem) {
        const nextStatus = wish.status === 'tampil' ? 'disembunyikan' : 'tampil';
        const actionLabel = nextStatus === 'tampil' ? 'ditampilkan kembali' : 'disembunyikan dari publik';

        router.patch(
            toggleStatus.url({ current_team: teamSlug, wish: wish.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Status Diperbarui',
                        `Pesan dari "${wish.nama_tampil}" telah berhasil ${actionLabel}.`,
                    );
                },
            },
        );
    }

    async function handleDelete(wish: WishItem) {
        const confirmed = await confirmDelete(
            'Pesan Wish Wall',
            `Pesan dari "${wish.nama_tampil}" akan dihapus permanen dan tidak dapat dipulihkan.`,
        );

        if (confirmed) {
            router.delete(destroy.url({ current_team: teamSlug, wish: wish.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess('Pesan Dihapus', 'Pesan telah dihapus secara permanen dari basis data.');
                },
            });
        }
    }

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <Head title="Moderasi Wish Wall - SIGAP" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName={auth?.user?.role === 'pembina' ? 'Pembina' : 'Arsip Periode'}
                        message="Mode pemantauan: Moderasi Wish Wall bersifat read-only. Pengubahan status dan penghapusan pesan dinonaktifkan."
                    />
                )}

                {/* ── Top Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                                Moderasi Wish Wall
                            </h1>
                            <span className="rounded-full bg-[#B8862E]/10 px-2.5 py-0.5 font-mono-sigap text-xs font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                {stats.total} Pesan
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Pantau aspirasi publik, sembunyikan pesan tidak pantas, dan kelola laporan pengunjung
                        </p>
                    </div>

                    <Link
                        href="/wish-wall"
                        target="_blank"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs font-medium text-[#1E2430] shadow-xs transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A] w-full sm:w-auto"
                    >
                        <Eye className="size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                        <span>Lihat Wish Wall Publik</span>
                    </Link>
                </div>

                {/* ── Metrics Grid ── */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-4">
                    <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 sm:p-4 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-8 sm:size-9 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <MessageSquare className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Total Pesan
                            </p>
                            <p className="font-display font-mono-sigap text-lg sm:text-xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {stats.total}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 sm:p-4 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-8 sm:size-9 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                            <Eye className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Tampil
                            </p>
                            <p className="font-display font-mono-sigap text-lg sm:text-xl font-semibold text-[#2E9E82] dark:text-[#34B394]">
                                {stats.tampil}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 sm:p-4 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-8 sm:size-9 items-center justify-center rounded-md bg-[#727C8E]/12 text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                            <EyeOff className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Disembunyikan
                            </p>
                            <p className="font-display font-mono-sigap text-lg sm:text-xl font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                                {stats.disembunyikan}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-3 sm:p-4 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-8 sm:size-9 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                            <Flag className="size-4 sm:size-4.5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                                Dilaporkan
                            </p>
                            <p className="font-display font-mono-sigap text-lg sm:text-xl font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                {stats.dilaporkan}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Table & Cards Section ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    {/* Header + Search Bar */}
                    <div className="flex flex-col gap-3 border-b border-[rgba(30,36,48,0.08)] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[rgba(255,255,255,0.08)]">
                        {/* Status Tabs */}
                        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9] p-1 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]">
                            {[
                                { key: 'semua', label: 'Semua', count: stats.total },
                                { key: 'tampil', label: 'Tampil', count: stats.tampil },
                                { key: 'disembunyikan', label: 'Disembunyikan', count: stats.disembunyikan },
                                { key: 'dilaporkan', label: 'Dilaporkan', count: stats.dilaporkan },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleFilterChange(tab.key)}
                                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                        statusFilter === tab.key
                                            ? 'bg-white text-[#4A5FD1] shadow-xs dark:bg-[#181E2B] dark:text-[#8FA0FA]'
                                            : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className="font-mono-sigap text-[10px] opacity-75">
                                        ({tab.count})
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-60">
                                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#727C8E]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari pengirim atau pesan..."
                                    className="w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-1.5 pl-8 pr-7 text-xs text-[#1E2430] placeholder-[#727C8E]/70 outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#727C8E] hover:text-[#1E2430]"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-[#4A5FD1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    {/* Content of Wishes */}
                    {wishes.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#F6F7F9] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                <MessageSquare className="size-6" />
                            </div>
                            <h3 className="mt-3 font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Tidak ada pesan
                            </h3>
                            <p className="mt-1 max-w-sm text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {searchQuery || statusFilter !== 'semua'
                                    ? 'Tidak ada pesan yang cocok dengan filter saat ini.'
                                    : 'Belum ada pesan yang dikirimkan ke Wish Wall.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Mobile Feed View (< 640px) ── */}
                            <div className="sm:hidden divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)] p-3 flex flex-col gap-2.5">
                                {wishes.data.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30 flex flex-col gap-2.5"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                    {item.nama_tampil.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-xs text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {item.nama_tampil}
                                                    </span>
                                                    <p className="font-mono-sigap text-[10px] text-[#727C8E]">
                                                        {item.waktu_relatif}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {item.jumlah_laporan > 0 && (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#B8862E]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                        <AlertTriangle className="size-2.5" />
                                                        <span>{item.jumlah_laporan}</span>
                                                    </span>
                                                )}
                                                {item.status === 'tampil' ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-[10px] font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                        Tampil
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[10px] font-semibold text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                                        Disembunyikan
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs leading-relaxed text-[#2E3542] dark:text-[#C5D0E0] whitespace-pre-line break-words border-l-2 border-[#4A5FD1]/30 pl-2.5 my-1">
                                            “{item.pesan}”
                                        </p>

                                        <div className="flex items-center justify-between border-t border-[rgba(30,36,48,0.06)] pt-2 dark:border-[rgba(255,255,255,0.06)]">
                                            <span className="font-mono-sigap text-[10px] text-[#727C8E]">
                                                {formatDate(item.created_at)}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(item)}
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                                                        item.status === 'tampil'
                                                            ? 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#C4514A]'
                                                            : 'bg-[#2E9E82]/10 text-[#2E9E82] hover:bg-[#2E9E82]/20'
                                                    }`}
                                                >
                                                    {item.status === 'tampil' ? (
                                                        <>
                                                            <EyeOff className="size-3" />
                                                            <span>Sembunyikan</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="size-3" />
                                                            <span>Tampilkan</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="rounded-md p-1.5 text-[#C4514A] hover:bg-[#C4514A]/10"
                                                    title="Hapus permanen"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Desktop Tabular View (≥ 640px) ── */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/60 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40 dark:text-[#8C97A8]">
                                            <th className="px-5 py-3">Pengirim</th>
                                            <th className="px-5 py-3">Isi Pesan</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="hidden px-5 py-3 md:table-cell">Laporan</th>
                                            <th className="hidden px-5 py-3 sm:table-cell">Waktu</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                        {wishes.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition hover:bg-[#FAFBFC] dark:hover:bg-[#1A2030]"
                                            >
                                                {/* Pengirim */}
                                                <td className="px-5 py-3.5 align-top whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                            {item.nama_tampil.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                                            {item.nama_tampil}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Isi Pesan */}
                                                <td className="px-5 py-3.5 align-top">
                                                    <p className="max-w-md text-xs leading-relaxed text-[#2E3542] dark:text-[#C5D0E0] whitespace-pre-line break-words">
                                                        “{item.pesan}”
                                                    </p>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3.5 align-top whitespace-nowrap">
                                                    {item.status === 'tampil' ? (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-[11px] font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                            <span className="size-1.5 rounded-full bg-[#2E9E82]" />
                                                            Tampil
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-semibold text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                                                            <span className="size-1.5 rounded-full bg-[#727C8E]" />
                                                            Disembunyikan
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Laporan */}
                                                <td className="hidden px-5 py-3.5 align-top whitespace-nowrap md:table-cell">
                                                    {item.jumlah_laporan > 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-[#B8862E]/12 px-2 py-0.5 text-[11px] font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                                                            <AlertTriangle className="size-3" />
                                                            <span>{item.jumlah_laporan} Laporan</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Waktu */}
                                                <td className="hidden px-5 py-3.5 align-top text-xs text-[#727C8E] sm:table-cell dark:text-[#8C97A8] whitespace-nowrap">
                                                    <p className="font-medium text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {item.waktu_relatif}
                                                    </p>
                                                    <p className="font-mono-sigap text-[10px] text-[#727C8E]/80">
                                                        {formatDate(item.created_at)}
                                                    </p>
                                                </td>

                                                {/* Aksi */}
                                                <td className="px-5 py-3.5 align-top text-right whitespace-nowrap">
                                                    {canManage ? (
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(item)}
                                                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                                                                    item.status === 'tampil'
                                                                        ? 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#C4514A] dark:hover:bg-[#21293A]'
                                                                        : 'bg-[#2E9E82]/10 text-[#2E9E82] hover:bg-[#2E9E82]/20 dark:bg-[#2E9E82]/20 dark:text-[#34B394]'
                                                                }`}
                                                                title={
                                                                    item.status === 'tampil'
                                                                        ? 'Sembunyikan pesan ini dari publik'
                                                                        : 'Tampilkan kembali pesan ini ke publik'
                                                                }
                                                            >
                                                                {item.status === 'tampil' ? (
                                                                    <>
                                                                        <EyeOff className="size-3" />
                                                                        <span>Sembunyikan</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Eye className="size-3" />
                                                                        <span>Tampilkan</span>
                                                                    </>
                                                                )}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(item)}
                                                                className="rounded-md p-1.5 text-[#C4514A] transition hover:bg-[#C4514A]/10 dark:hover:bg-[#C4514A]/20"
                                                                title="Hapus permanen"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#727C8E]/50">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {wishes.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[rgba(30,36,48,0.08)] px-4 sm:px-5 py-3 dark:border-[rgba(255,255,255,0.08)]">
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Halaman {wishes.current_page} dari {wishes.last_page} ({wishes.total} pesan)
                            </p>
                            <div className="flex flex-wrap items-center gap-1">
                                {wishes.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className="rounded-md px-2.5 py-1 text-xs text-[#727C8E]/50 dark:text-[#8C97A8]/50"
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            preserveScroll
                                            preserveState
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                                                link.active
                                                    ? 'bg-[#4A5FD1] text-white'
                                                    : 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]'
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

PengurusWishWallIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? pengurusDashboard.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Pengurus',
            href: '#',
        },
        {
            title: 'Kelola Wish Wall',
            href: '#',
        },
    ],
});
