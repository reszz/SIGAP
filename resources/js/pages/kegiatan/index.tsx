import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, Plus, Pencil, Trash2, Eye, Search } from 'lucide-react';
import { create, index as kegiatanIndex } from '@/routes/pengurus/kegiatan';
import { useState, useMemo } from 'react';

type Sesi = {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
};

type Kegiatan = {
    id: number;
    nama: string;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    deskripsi: string | null;
    sesi_count: number;
    created_at: string;
};

type Props = {
    kegiatan: Kegiatan[];
};

const STATUS_MAP = {
    terjadwal: {
        label: 'Terjadwal',
        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    berlangsung: {
        label: 'Berlangsung',
        cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    selesai: {
        label: 'Selesai',
        cls: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    },
};

function TipeBadge({ tipe }: { tipe: Kegiatan['tipe'] }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tipe === 'terbuka'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}
        >
            {tipe === 'terbuka' ? 'Terbuka' : 'Wajib Hadir'}
        </span>
    );
}

export default function KegiatanIndex({ kegiatan }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [searchQuery, setSearchQuery] = useState('');

    const filteredKegiatan = useMemo(() => {
        if (!searchQuery.trim()) return kegiatan;
        const query = searchQuery.toLowerCase();
        return kegiatan.filter(
            (kg) =>
                kg.nama.toLowerCase().includes(query) ||
                kg.deskripsi?.toLowerCase().includes(query),
        );
    }, [kegiatan, searchQuery]);

    function handleDelete(id: number, nama: string) {
        if (
            !confirm(
                `Hapus kegiatan "${nama}"? Semua sesi terkait juga akan dihapus.`,
            )
        )
            return;
        router.delete(`/${teamSlug}/pengurus/kegiatan/${id}`, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Kelola Kegiatan" />

            <div className="flex h-full flex-col gap-4 p-3 sm:gap-5 sm:p-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-neutral-900 sm:text-xl dark:text-neutral-100">
                            Kelola Kegiatan
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
                            {filteredKegiatan.length} dari {kegiatan.length}{' '}
                            kegiatan
                        </p>
                    </div>
                    <Link
                        href={create.url(teamSlug)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto sm:px-4 sm:text-sm"
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">
                            Tambah Kegiatan
                        </span>
                        <span className="sm:hidden">Tambah</span>
                    </Link>
                </div>

                {/* Search Bar */}
                {kegiatan.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2.5 py-2 sm:px-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <Search className="size-4 shrink-0 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari kegiatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-neutral-400 sm:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="shrink-0 text-neutral-400 transition hover:text-neutral-600 dark:hover:text-neutral-300"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* List */}
                {kegiatan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 dark:border-neutral-700">
                        <CalendarDays className="size-10 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-sm text-neutral-500">
                            Belum ada kegiatan. Mulai tambahkan!
                        </p>
                        <Link
                            href={create.url(teamSlug)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                        >
                            <Plus className="size-4" /> Tambah Kegiatan
                        </Link>
                    </div>
                ) : filteredKegiatan.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 py-20 dark:border-neutral-700">
                        <Search className="size-10 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-sm text-neutral-500">
                            Tidak ada kegiatan yang cocok dengan pencarian "
                            {searchQuery}".
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            Bersihkan pencarian
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-2 sm:gap-3">
                        {filteredKegiatan.map((kg) => (
                            <div
                                key={kg.id}
                                className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 bg-white p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4 dark:border-sidebar-border dark:bg-neutral-900"
                            >
                                {/* Warna dot + Info */}
                                <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                                    <span
                                        className="mt-1 size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-neutral-900"
                                        style={{ backgroundColor: kg.warna }}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                                            <p className="text-sm font-semibold break-words text-neutral-900 sm:text-base dark:text-neutral-100">
                                                {kg.nama}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                <TipeBadge tipe={kg.tipe} />
                                                {kg.tipe === 'terbuka' &&
                                                    kg.kuota && (
                                                        <span className="text-xs text-neutral-400">
                                                            Kuota: {kg.kuota}
                                                        </span>
                                                    )}
                                            </div>
                                        </div>
                                        <p className="mt-0.5 text-xs text-neutral-500">
                                            {kg.sesi_count} sesi
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-1.5 sm:shrink-0 sm:flex-nowrap sm:gap-2">
                                    <Link
                                        href={`/${teamSlug}/kegiatan/${kg.id}/detail`}
                                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 sm:flex-none sm:gap-1.5 sm:px-2.5 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        <Eye className="size-3.5 shrink-0" />
                                        <span className="hidden sm:inline">
                                            Detail
                                        </span>
                                    </Link>
                                    <Link
                                        href={`/${teamSlug}/pengurus/kegiatan/${kg.id}/edit`}
                                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 sm:flex-none sm:gap-1.5 sm:px-2.5 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        <Pencil className="size-3.5 shrink-0" />
                                        <span className="hidden sm:inline">
                                            Edit
                                        </span>
                                    </Link>
                                    <button
                                        onClick={() =>
                                            handleDelete(kg.id, kg.nama)
                                        }
                                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 sm:flex-none sm:gap-1.5 sm:px-2.5 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="size-3.5 shrink-0" />
                                        <span className="hidden sm:inline">
                                            Hapus
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
