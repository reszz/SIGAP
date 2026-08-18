import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Pencil, Trash2, Plus, Users, X, Check, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

type Anggota = {
    id: number;
    name: string;
    nim: string;
    email: string;
    created_at: string;
};

type Props = { anggota: Anggota[] };

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

// Modal tambah anggota
function TambahAnggotaModal({
    teamSlug,
    onClose,
}: {
    teamSlug: string;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        nim: '',
        email: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${teamSlug}/pengurus/anggota`, {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-neutral-900">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        Tambah Anggota
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="contoh: Budi Santoso"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            NIM <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.nim}
                            onChange={(e) => setData('nim', e.target.value)}
                            placeholder="contoh: 12345678"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <InputError message={errors.nim} />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="contoh: budi@mahasiswa.ac.id"
                            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <InputError message={errors.email} />
                    </div>
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        Password default: <strong>password</strong> — anggota
                        bisa ubah sendiri di halaman Pengaturan setelah login.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Check className="size-4" />
                            {processing ? 'Menyimpan...' : 'Buat Akun'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Inline edit row
function AnggotaRow({ a, teamSlug }: { a: Anggota; teamSlug: string }) {
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        name: a.name,
        nim: a.nim,
        email: a.email,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/${teamSlug}/pengurus/anggota/${a.id}`, {
            onSuccess: () => setEditing(false),
        });
    }

    function handleDelete() {
        if (!confirm(`Hapus akun "${a.name}" (${a.nim})?`)) return;
        router.delete(`/${teamSlug}/pengurus/anggota/${a.id}`, {
            preserveScroll: true,
        });
    }

    if (editing) {
        return (
            <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded border border-indigo-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-indigo-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.name} />
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                    <input
                        type="text"
                        value={data.nim}
                        onChange={(e) => setData('nim', e.target.value)}
                        className="w-full rounded border border-indigo-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-indigo-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.nim} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full rounded border border-indigo-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none sm:text-sm dark:border-indigo-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.email} />
                </td>
                <td className="hidden px-4 py-3 text-xs text-neutral-400 md:table-cell">
                    —
                </td>
                <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <button
                            onClick={submit}
                            disabled={processing}
                            className="inline-flex items-center gap-0.5 rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:gap-1 sm:px-2.5"
                        >
                            <Check className="size-3" />{' '}
                            <span className="hidden sm:inline">Simpan</span>
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="rounded border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50 sm:px-2.5 dark:border-neutral-700 dark:text-neutral-400"
                        >
                            <span className="hidden sm:inline">Batal</span>
                            <span className="sm:hidden">X</span>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50">
            <td className="px-2.5 py-2 text-xs font-medium text-neutral-800 sm:px-4 sm:py-3 sm:text-sm dark:text-neutral-100">
                {a.name}
            </td>
            <td className="px-2.5 py-2 font-mono text-xs text-neutral-600 sm:px-4 sm:py-3 sm:text-sm dark:text-neutral-400">
                {a.nim}
            </td>
            <td className="hidden px-4 py-3 text-xs text-neutral-600 sm:table-cell sm:text-sm dark:text-neutral-400">
                {a.email}
            </td>
            <td className="hidden px-4 py-3 text-xs text-neutral-400 md:table-cell">
                {new Date(a.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })}
            </td>
            <td className="px-2.5 py-2 sm:px-4 sm:py-3">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 sm:gap-1 sm:px-2.5 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    >
                        <Pencil className="size-3" />{' '}
                        <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                        onClick={handleDelete}
                        className="inline-flex items-center gap-0.5 rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 sm:gap-1 sm:px-2.5 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="size-3" />{' '}
                        <span className="hidden sm:inline">Hapus</span>
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function AnggotaIndex({ anggota }: Props) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAnggota = useMemo(() => {
        if (!searchQuery.trim()) return anggota;
        const query = searchQuery.toLowerCase();
        return anggota.filter(
            (a) =>
                a.name.toLowerCase().includes(query) ||
                a.nim.toLowerCase().includes(query) ||
                a.email.toLowerCase().includes(query),
        );
    }, [anggota, searchQuery]);

    return (
        <>
            <Head title="Kelola Anggota" />

            {showModal && (
                <TambahAnggotaModal
                    teamSlug={teamSlug}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="flex h-full flex-col gap-4 p-3 sm:gap-5 sm:p-4">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold text-neutral-900 sm:text-xl dark:text-neutral-100">
                            Kelola Anggota
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">
                            {filteredAnggota.length} dari {anggota.length}{' '}
                            anggota
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto sm:px-4 sm:text-sm"
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">Tambah Anggota</span>
                        <span className="sm:hidden">Tambah</span>
                    </button>
                </div>

                {/* Search Bar */}
                {anggota.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-2.5 py-2 sm:px-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <Search className="size-4 shrink-0 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari anggota..."
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

                {/* Tabel */}
                {anggota.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 py-12 sm:py-20 dark:border-neutral-700">
                        <Users className="size-8 text-neutral-300 sm:size-10 dark:text-neutral-600" />
                        <p className="px-4 text-center text-xs text-neutral-500 sm:text-sm">
                            Belum ada anggota. Mulai tambahkan akun.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 sm:text-sm"
                        >
                            <Plus className="size-4" /> Tambah Anggota
                        </button>
                    </div>
                ) : filteredAnggota.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-neutral-300 py-12 sm:py-20 dark:border-neutral-700">
                        <Search className="size-8 text-neutral-300 sm:size-10 dark:text-neutral-600" />
                        <p className="px-4 text-center text-xs text-neutral-500 sm:text-sm">
                            Tidak ada anggota yang cocok dengan pencarian "
                            {searchQuery}".
                        </p>
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs font-medium text-indigo-600 hover:underline sm:text-sm dark:text-indigo-400"
                        >
                            Bersihkan pencarian
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 bg-white dark:border-sidebar-border dark:bg-neutral-900">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/50">
                                    <th className="px-2.5 py-2.5 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:px-4 sm:py-3">
                                        Nama
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:px-4 sm:py-3">
                                        NIM
                                    </th>
                                    <th className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:table-cell">
                                        Email
                                    </th>
                                    <th className="hidden px-4 py-3 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase md:table-cell">
                                        Bergabung
                                    </th>
                                    <th className="px-2.5 py-2.5 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase sm:px-4 sm:py-3">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAnggota.map((a) => (
                                    <AnggotaRow
                                        key={a.id}
                                        a={a}
                                        teamSlug={teamSlug}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
