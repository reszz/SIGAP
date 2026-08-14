import { Head, Link, router, usePage } from '@inertiajs/react';
import { CalendarDays, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { create, index as kegiatanIndex } from '@/routes/pengurus/kegiatan';

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

            <div className="flex h-full flex-col gap-5 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            Kelola Kegiatan
                        </h1>
                        <p className="mt-0.5 text-sm text-neutral-500">
                            {kegiatan.length} kegiatan terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url(teamSlug)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="size-4" />
                        Tambah Kegiatan
                    </Link>
                </div>

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
                ) : (
                    <div className="grid gap-3">
                        {kegiatan.map((kg) => (
                            <div
                                key={kg.id}
                                className="flex items-center gap-4 rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-neutral-900"
                            >
                                {/* Warna dot */}
                                <span
                                    className="size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-neutral-900"
                                    style={{ backgroundColor: kg.warna }}
                                />

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                            {kg.nama}
                                        </p>
                                        <TipeBadge tipe={kg.tipe} />
                                        {kg.tipe === 'terbuka' && kg.kuota && (
                                            <span className="text-xs text-neutral-400">
                                                Kuota: {kg.kuota}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-neutral-500">
                                        {kg.sesi_count} sesi
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-1">
                                    <Link
                                        href={`/${teamSlug}/kegiatan/${kg.id}/detail`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        <Eye className="size-3.5" />
                                        Detail
                                    </Link>
                                    <Link
                                        href={`/${teamSlug}/pengurus/kegiatan/${kg.id}/edit`}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    >
                                        <Pencil className="size-3.5" />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() =>
                                            handleDelete(kg.id, kg.nama)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="size-3.5" />
                                        Hapus
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
