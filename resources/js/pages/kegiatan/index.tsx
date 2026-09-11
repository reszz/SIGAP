import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import EventDetailCard from '@/components/event-detail-card';
import StatusStiker from '@/components/ui/status-stiker';
import EmptyState from '@/components/ui/empty-state';
import { create } from '@/routes/pengurus/kegiatan';
import pengurus, {dashboard as pengurusDashboard} from '@/routes/pengurus';
import { confirmDelete } from '@/lib/sweetalert';
import ReadOnlyBanner from '@/components/read-only-banner';

type Kegiatan = {
    id: number;
    nama: string;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    deskripsi: string | null;
    sesi_count: number;
    kepanitiaan_count: number;
    status_agregat: 'berlangsung' | 'selesai' | 'terjadwal' | 'belum_ada_sesi';
    created_at: string;
};

type Props = {
    kegiatan: Kegiatan[];
    canManage?: boolean;
    isReadOnly?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string | null, max = 90): string {
    if (!str) return '';
    return str.length > max ? str.slice(0, max) + '…' : str;
}

// ─── KegiatanCard ─────────────────────────────────────────────────────────────

function KegiatanCard({
    kg,
    teamSlug,
    canManage,
    onOpenDetail,
    onDelete,
}: {
    kg: Kegiatan;
    teamSlug: string;
    canManage: boolean;
    onOpenDetail: (id: number) => void;
    onDelete: (id: number, nama: string) => void;
}) {
    const isBelumAda = kg.status_agregat === 'belum_ada_sesi';
    const eventColor = kg.warna ?? '#4A5FD1';

    return (
        <div
            className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-none transition-all duration-150 hover:border-[#4A5FD1]/40 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:hover:border-[#586DE6]/40"
            onClick={(e) => {
                if ((e.target as HTMLElement).closest('[data-action]')) return;
                onOpenDetail(kg.id);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onOpenDetail(kg.id)}
            aria-label={`Lihat detail ${kg.nama}`}
        >
            {/* Top flat color bar 3px */}
            <div
                className="h-1 w-full shrink-0"
                style={{ backgroundColor: eventColor }}
            />

            <div className="flex flex-1 flex-col gap-4 p-6">
                {/* Badges row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {!isBelumAda ? (
                        <StatusStiker status={kg.status_agregat} />
                    ) : (
                        <span className="rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-[11px] font-medium text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
                            Belum Ada Sesi
                        </span>
                    )}
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            kg.tipe === 'terbuka'
                                ? 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                : 'bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]'
                        }`}
                    >
                        {kg.tipe === 'terbuka' ? 'Terbuka' : 'Wajib Hadir'}
                    </span>
                </div>

                {/* Nama & Deskripsi */}
                <div>
                    <h3 className="font-display text-base font-semibold text-[#1E2430] transition-colors group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                        {kg.nama}
                    </h3>

                    {kg.deskripsi ? (
                        <p className="mt-1 text-xs leading-relaxed text-[#727C8E] line-clamp-2 dark:text-[#8C97A8]">
                            {truncate(kg.deskripsi)}
                        </p>
                    ) : (
                        <p className="mt-1 text-xs italic text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                            Tidak ada deskripsi.
                        </p>
                    )}
                </div>

                {/* Stats row */}
                <div className="mt-auto flex items-center gap-4 border-t border-[rgba(30,36,48,0.06)] pt-3 text-xs text-[#727C8E] dark:border-[rgba(255,255,255,0.06)] dark:text-[#8C97A8]">
                    <span className="flex items-center gap-1.5 font-mono-sigap text-[11px]">
                        <CalendarDays className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                        <span>{kg.sesi_count} Sesi</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono-sigap text-[11px]">
                        <Users className="size-3.5 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                        <span>{kg.kepanitiaan_count} Panitia</span>
                    </span>
                </div>

                {/* Action buttons */}
                {canManage && (
                    <div
                        data-action
                        className="flex items-center gap-2 pt-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Link
                            href={pengurus.kegiatan.edit.url({ current_team: teamSlug, kegiatan: kg.id })}
                            data-action
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        >
                            <Pencil className="size-3.5" />
                            Edit
                        </Link>
                        <button
                            type="button"
                            data-action
                            onClick={() => onDelete(kg.id, kg.nama)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#C4514A]/10 px-3 py-1.5 text-xs font-semibold text-[#C4514A] transition hover:bg-[#C4514A]/20 dark:bg-[#C4514A]/20 dark:text-[#D9615A]"
                        >
                            <Trash2 className="size-3.5" />
                            Hapus
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KegiatanIndex({ kegiatan, canManage = true, isReadOnly = false }: Props) {
    const { currentTeam, auth } = usePage<any>().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return kegiatan;
        const q = searchQuery.toLowerCase();
        return kegiatan.filter(
            (kg) => kg.nama.toLowerCase().includes(q) || kg.deskripsi?.toLowerCase().includes(q),
        );
    }, [kegiatan, searchQuery]);

    async function handleDelete(id: number, nama: string) {
        const confirmed = await confirmDelete(
            `kegiatan "${nama}"`,
            'Semua sesi, rundown, dan data terkait kegiatan ini juga akan dihapus.',
        );
        if (!confirmed) return;
        router.delete(`/${teamSlug}/pengurus/kegiatan/${id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Kelola Kegiatan" />

            <div className="flex h-full flex-col gap-6 p-5 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName={auth?.user?.role === 'pembina' ? 'Pembina' : 'Arsip Periode'}
                        message={
                            auth?.user?.role === 'pembina'
                                ? 'Anda sedang dalam mode pemantauan kegiatan. Anda dapat melihat dan memantau semua proyek kegiatan tanpa akses untuk membuat, mengubah, atau menghapus.'
                                : 'Mode pemantauan: Pengelolaan kegiatan dinonaktifkan pada periode lampau yang bersifat arsip.'
                        }
                    />
                )}

                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-2xl dark:text-[#E6ECF5]">
                            Kelola Proyek & Kegiatan
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            <span className="font-mono-sigap font-semibold">{filtered.length}</span> dari <span className="font-mono-sigap font-semibold">{kegiatan.length}</span> total proyek terdaftar
                        </p>
                    </div>
                    {canManage && (
                        <Link
                            href={create.url(teamSlug)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] sm:w-auto"
                        >
                            <Plus className="size-4" />
                            Tambah Kegiatan
                        </Link>
                    )}
                </div>

                {/* Search Bar */}
                {kegiatan.length > 0 && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <Search className="size-4 shrink-0 text-[#727C8E]" />
                        <input
                            type="text"
                            placeholder="Cari kegiatan berdasarkan nama atau deskripsi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-xs font-normal text-[#1E2430] outline-none placeholder:text-[#727C8E] dark:text-[#E6ECF5] dark:placeholder:text-[#8C97A8]"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-xs font-medium text-[#727C8E] hover:text-[#1E2430] dark:hover:text-[#E6ECF5]"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                {kegiatan.length === 0 ? (
                    <EmptyState
                        icon={CalendarDays}
                        title="Belum ada proyek atau kegiatan"
                        description={isReadOnly ? 'Belum ada kegiatan yang terdaftar untuk periode ini.' : 'Mulai satu kegiatan baru untuk melacak progres tim dan presensi.'}
                        action={
                            canManage ? (
                                <Link
                                    href={create.url(teamSlug)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                >
                                    <Plus className="size-4" /> Buat Proyek Baru
                                </Link>
                            ) : undefined
                        }
                    />
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="Kegiatan tidak ditemukan"
                        description={`Tidak ada kegiatan yang cocok dengan "${searchQuery}".`}
                        action={
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-xs font-semibold text-[#4A5FD1] hover:underline"
                            >
                                Bersihkan pencarian
                            </button>
                        }
                    />
                ) : (
                    /* Grid Cards */
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((kg) => (
                            <KegiatanCard
                                key={kg.id}
                                kg={kg}
                                teamSlug={teamSlug}
                                canManage={canManage}
                                onOpenDetail={setSelectedKegiatanId}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Slide-in Detail Kegiatan */}
            {selectedKegiatanId !== null && (
                <EventDetailCard
                    kegiatanId={selectedKegiatanId}
                    onClose={() => setSelectedKegiatanId(null)}
                />
            )}
        </>
    );
}
KegiatanIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? pengurusDashboard.url(props.currentTeam.slug)
                : '/',
        },
        {
            title: 'Kelola Kegiatan',
            href: '#',
        },
    ],
});
