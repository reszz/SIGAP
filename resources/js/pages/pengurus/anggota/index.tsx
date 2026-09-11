import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Pencil,
    Trash2,
    Plus,
    Users,
    X,
    Check,
    Search,
    UserCheck,
    Calendar,
    Mail,
    Crown,
    RefreshCw,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import ReadOnlyBanner from '@/components/read-only-banner';
import { confirmDelete, confirmRoleChange, showSuccess } from '@/lib/sweetalert';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';

type DivisiItem = {
    id: number;
    nama_divisi: string;
};

type Anggota = {
    id: number;
    name: string;
    nim: string;
    email: string;
    role: 'pengurus' | 'anggota';
    created_at: string;
    jabatan?: string | null;
    divisi?: string | null;
    divisi_organisasi_id?: number | null;
    status_periode?: string;
};

type Props = {
    anggota: Anggota[];
    divisiList?: DivisiItem[];
    canManage?: boolean;
    isReadOnly?: boolean;
};

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: 'pengurus' | 'anggota' }) {
    return role === 'pengurus' ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#B8862E]/12 px-2 py-0.5 text-xs font-semibold text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
            <Crown className="size-3" />
            Pengurus
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#727C8E]/12 px-2 py-0.5 text-xs font-semibold text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
            <Users className="size-3" />
            Anggota
        </span>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-[#C4514A] font-medium">{message}</p>;
}

// ─── Modal Tambah Anggota ─────────────────────────────────────────────────────

function TambahAnggotaModal({
    teamSlug,
    divisiList = [],
    onClose,
}: {
    teamSlug: string;
    divisiList?: DivisiItem[];
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        nim: '',
        email: '',
        jabatan: '',
        divisi_organisasi_id: '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/${teamSlug}/pengurus/anggota`, {
            onSuccess: () => {
                showSuccess(
                    'Akun Berhasil Didaftarkan!',
                    `Anggota "${data.name}" telah berhasil didaftarkan ke dalam periode ini.`,
                );
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-lg border border-[rgba(30,36,48,0.12)] bg-white p-6 shadow-xl dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                <div className="mb-5 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <UserCheck className="size-4" />
                        </div>
                        <div>
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Tambah Anggota ke Periode
                            </h2>
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">Daftarkan anggota ke periode aktif saat ini</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1.5 text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                            Nama Lengkap <span className="text-[#C4514A]">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                NIM / Nomor Induk <span className="text-[#C4514A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nim}
                                onChange={(e) => setData('nim', e.target.value)}
                                placeholder="Contoh: 210101001"
                                className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <InputError message={errors.nim} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Alamat Email <span className="text-[#C4514A]">*</span>
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="budi@kampus.ac.id"
                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <InputError message={errors.email} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Divisi Organisasi
                            </label>
                            <select
                                value={data.divisi_organisasi_id}
                                onChange={(e) => setData('divisi_organisasi_id', e.target.value)}
                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            >
                                <option value="">Tanpa Divisi</option>
                                {divisiList.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nama_divisi}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.divisi_organisasi_id} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Jabatan (Opsional)
                            </label>
                            <input
                                type="text"
                                value={data.jabatan}
                                onChange={(e) => setData('jabatan', e.target.value)}
                                placeholder="Staff, Koordinator..."
                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <InputError message={errors.jabatan} />
                        </div>
                    </div>

                    <div className="rounded-md border border-[#4A5FD1]/20 bg-[#4A5FD1]/5 p-2.5 text-[11px] text-[#4A5FD1] dark:text-[#8FA0FA]">
                        Jika akun dengan NIM / Email sudah ada, sistem akan langsung mendaftarkannya ke periode kepengurusan ini tanpa membuat akun baru.
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#8C97A8]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-1.5 rounded-md bg-[#4A5FD1] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            {processing ? 'Menyimpan...' : 'Daftarkan Anggota'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── AnggotaRow ───────────────────────────────────────────────────────────────

function AnggotaRow({
    a,
    teamSlug,
    divisiList = [],
    canManage = true,
}: {
    a: Anggota;
    teamSlug: string;
    divisiList?: DivisiItem[];
    canManage?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        name: a.name,
        nim: a.nim,
        email: a.email,
        jabatan: a.jabatan ?? '',
        divisi_organisasi_id: a.divisi_organisasi_id ? String(a.divisi_organisasi_id) : '',
    });

    const initials = a.name
        ? a.name
              .split(' ')
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase()
        : 'U';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/${teamSlug}/pengurus/anggota/${a.id}`, {
            onSuccess: () => {
                showSuccess(
                    'Data Berhasil Diperbarui!',
                    `Informasi akun "${data.name}" telah berhasil diperbarui.`,
                );
                setEditing(false);
            },
        });
    }

    async function handleDelete() {
        const confirmed = await confirmDelete(
            a.name,
            `Anggota ${a.name} (${a.nim}) akan dikeluarkan dari periode ini. Data riwayat di periode lain dan akun pengguna akan tetap tersimpan.`,
        );
        if (!confirmed) return;

        router.delete(`/${teamSlug}/pengurus/anggota/${a.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                showSuccess(
                    'Anggota Dikeluarkan!',
                    `Anggota "${a.name}" telah berhasil dikeluarkan dari periode ini.`,
                );
            },
        });
    }

    async function handleToggleRole() {
        const newRole = a.role === 'pengurus' ? 'anggota' : 'pengurus';
        const roleLabel = newRole === 'pengurus' ? 'Pengurus' : 'Anggota';
        const confirmed = await confirmRoleChange(a.name, newRole);
        if (!confirmed) return;

        router.patch(
            `/${teamSlug}/pengurus/anggota/${a.id}/role`,
            { role: newRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(
                        'Role Berhasil Diubah!',
                        `Role "${a.name}" kini telah resmi dialihkan ke level ${roleLabel}.`,
                    );
                },
            },
        );
    }

    if (editing) {
        return (
            <tr className="bg-[#4A5FD1]/5 dark:bg-[#4A5FD1]/10">
                <td className="px-5 py-3">
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-md border border-[#4A5FD1]/40 bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.name} />
                </td>
                <td className="px-5 py-3">
                    <input
                        type="text"
                        value={data.nim}
                        onChange={(e) => setData('nim', e.target.value)}
                        className="font-mono-sigap w-full rounded-md border border-[#4A5FD1]/40 bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.nim} />
                </td>
                <td className="hidden px-5 py-3 sm:table-cell">
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        className="w-full rounded-md border border-[#4A5FD1]/40 bg-white px-2.5 py-1 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                    />
                    <InputError message={errors.email} />
                </td>
                <td className="hidden px-5 py-3 md:table-cell">
                    <div className="flex flex-col gap-1">
                        <select
                            value={data.divisi_organisasi_id}
                            onChange={(e) => setData('divisi_organisasi_id', e.target.value)}
                            className="w-full rounded-md border border-[#4A5FD1]/40 bg-white px-2 py-1 text-xs text-[#1E2430] dark:bg-neutral-800 dark:text-neutral-100"
                        >
                            <option value="">Tanpa Divisi</option>
                            {divisiList.map((d) => (
                                <option key={d.id} value={d.id}>{d.nama_divisi}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={data.jabatan}
                            onChange={(e) => setData('jabatan', e.target.value)}
                            placeholder="Jabatan..."
                            className="w-full rounded-md border border-[#4A5FD1]/40 bg-white px-2 py-1 text-xs text-[#1E2430] dark:bg-neutral-800 dark:text-neutral-100"
                        />
                    </div>
                </td>
                <td className="hidden px-5 py-3 lg:table-cell">
                    <RoleBadge role={a.role} />
                </td>
                <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <button
                            onClick={submit}
                            disabled={processing}
                            className="flex items-center gap-1 rounded-md bg-[#4A5FD1] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            <span>Simpan</span>
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-1 text-xs font-semibold text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#8C97A8]"
                        >
                            Batal
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-b border-[rgba(30,36,48,0.06)] transition hover:bg-[#F6F7F9]/50 dark:border-[rgba(255,255,255,0.06)] dark:hover:bg-[#21293A]/30">
            {/* Nama + Avatar */}
            <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <div className={`flex size-7.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${a.role === 'pengurus' ? 'bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]' : 'bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'}`}>
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            {a.name}
                        </p>
                        <p className="truncate text-[10px] text-[#727C8E] sm:hidden dark:text-[#8C97A8]">
                            {a.email}
                        </p>
                    </div>
                </div>
            </td>

            {/* NIM */}
            <td className="px-5 py-3 font-mono-sigap text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                <span className="rounded-md bg-[#F6F7F9] px-2 py-0.5 dark:bg-[#21293A]">
                    {a.nim}
                </span>
            </td>

            {/* Email */}
            <td className="hidden px-5 py-3 text-xs font-medium text-[#727C8E] sm:table-cell dark:text-[#8C97A8]">
                <div className="flex items-center gap-1.5">
                    <Mail className="size-3 text-[#727C8E]" />
                    <span>{a.email}</span>
                </div>
            </td>

            {/* Divisi & Jabatan di Periode Ini */}
            <td className="hidden px-5 py-3 text-xs font-medium text-[#727C8E] md:table-cell dark:text-[#8C97A8]">
                {a.divisi || a.jabatan ? (
                    <div className="flex flex-col">
                        <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            {a.divisi ?? 'Umum'}
                        </span>
                        {a.jabatan && (
                            <span className="text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                {a.jabatan}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground italic">Belum di-assign</span>
                )}
            </td>

            {/* Role */}
            <td className="hidden px-5 py-3 lg:table-cell">
                <RoleBadge role={a.role} />
            </td>

            {/* Aksi */}
            <td className="px-5 py-3 text-right">
                {canManage ? (
                    <div className="flex items-center justify-end gap-1">
                        <button
                            onClick={handleToggleRole}
                            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                                a.role === 'pengurus'
                                    ? 'text-[#B8862E] hover:bg-[#B8862E]/10'
                                    : 'text-[#727C8E] hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:hover:bg-[#21293A]'
                            }`}
                            title={a.role === 'pengurus' ? 'Turunkan ke Anggota' : 'Jadikan Pengurus'}
                        >
                            <RefreshCw className="size-3" />
                            <span className="hidden sm:inline">
                                {a.role === 'pengurus' ? 'Anggota' : 'Pengurus'}
                            </span>
                        </button>
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-1 rounded-md p-1.5 text-xs font-semibold text-[#727C8E] transition hover:bg-[#4A5FD1]/10 hover:text-[#4A5FD1]"
                            title="Edit data anggota"
                        >
                            <Pencil className="size-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center gap-1 rounded-md p-1.5 text-xs font-semibold text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                            title="Keluarkan dari periode ini"
                        >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
                        </button>
                    </div>
                ) : (
                    <span className="text-[11px] text-muted-foreground">Read-only</span>
                )}
            </td>
        </tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnggotaIndex({ anggota, divisiList = [], canManage = true, isReadOnly = false }: Props) {
    const { currentTeam, auth } = usePage<any>().props;
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
                a.email.toLowerCase().includes(query) ||
                (a.divisi && a.divisi.toLowerCase().includes(query)) ||
                (a.jabatan && a.jabatan.toLowerCase().includes(query)),
        );
    }, [anggota, searchQuery]);

    return (
        <>
            <Head title="Kelola Anggota" />

            {showModal && (
                <TambahAnggotaModal
                    teamSlug={teamSlug}
                    divisiList={divisiList}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName={auth?.user?.role === 'pembina' ? 'Pembina' : 'Arsip Periode'}
                        message="Mode pemantauan: Pengelolaan anggota dinonaktifkan pada periode lampau yang bersifat arsip."
                    />
                )}

                {/* ── Top Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Kelola Anggota Tim
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Manajemen akun anggota organisasi, kredensial login, dan penugasan divisi per periode
                        </p>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                        >
                            <Plus className="size-4" />
                            <span>Tambah Anggota</span>
                        </button>
                    )}
                </div>

                {/* ── 3 Summary KPI Tiles ── */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Total Anggota
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {anggota.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#B8862E]/12 text-[#B8862E] dark:bg-[#B8862E]/20 dark:text-[#D4A142]">
                            <Crown className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Pengurus
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                {anggota.filter((a) => a.role === 'pengurus').length}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <div className="flex size-10 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                            <UserCheck className="size-5" />
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                Anggota Biasa
                            </p>
                            <p className="font-display font-mono-sigap text-2xl font-semibold text-[#2E9E82] dark:text-[#34B394]">
                                {anggota.filter((a) => a.role === 'anggota').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Table & Search Card ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    {/* Header + Search Bar */}
                    <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-[rgba(30,36,48,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                        <div>
                            <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Daftar Akun Anggota
                            </h2>
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Menampilkan {filteredAnggota.length} dari {anggota.length} total anggota
                            </p>
                        </div>

                        {anggota.length > 0 && (
                            <div className="flex items-center gap-2 rounded-md border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 px-3 py-1.5 sm:w-72 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/40">
                                <Search className="size-3.5 shrink-0 text-[#727C8E]" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, NIM, atau email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-[#727C8E]/70 dark:text-[#E6ECF5]"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-xs text-[#727C8E] hover:text-[#1E2430]"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Table Content */}
                    {anggota.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="flex size-12 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Users className="size-6" />
                            </div>
                            <h3 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Belum Ada Anggota
                            </h3>
                            <p className="max-w-xs text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Mulai tambahkan akun anggota agar mereka dapat login dan berpartisipasi dalam kegiatan.
                            </p>
                            {canManage && (
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                >
                                    <Plus className="size-4" /> Tambah Anggota Pertama
                                </button>
                            )}
                        </div>
                    ) : filteredAnggota.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <Search className="size-8 text-[#727C8E]/40" />
                            <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                Tidak ada anggota yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
                            </p>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-xs font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                            >
                                Bersihkan Pencarian
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/60 text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40 dark:text-[#8C97A8]">
                                        <th className="px-5 py-3">Nama Anggota</th>
                                        <th className="px-5 py-3">NIM</th>
                                        <th className="hidden px-5 py-3 sm:table-cell">Email</th>
                                        <th className="hidden px-5 py-3 md:table-cell">Divisi / Jabatan</th>
                                        <th className="hidden px-5 py-3 lg:table-cell">Role</th>
                                        <th className="px-5 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAnggota.map((a) => (
                                        <AnggotaRow
                                            key={a.id}
                                            a={a}
                                            teamSlug={teamSlug}
                                            divisiList={divisiList}
                                            canManage={canManage}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

AnggotaIndex.layout = (props: {currentTeam?: {slug: string } | null })=> ({
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
            title: 'Kelola Tim & Anggota',
            href: '#',
        }
    ],
});
