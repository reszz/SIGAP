import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Plus,
    Pencil,
    Trash2,
    X,
    Users,
    Layers,
    ChevronDown,
    Upload,
    Building2,
    ShieldCheck,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { confirmDelete, showSuccess } from '@/lib/sweetalert';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';
import AnggotaIndex from '@/pages/pengurus/anggota';
import PengurusWishWallIndex from '@/pages/pengurus/wish-wall';
import ReadOnlyBanner from '@/components/read-only-banner';

// ─── Types ────────────────────────────────────────────────────────────────────

type Divisi = {
    id: number;
    nama_divisi: string;
    deskripsi: string | null;
    urutan_tampil: number;
    pengurus_count: number;
};

type PengurusItem = {
    id: number;
    nama: string;
    jabatan: string;
    divisi_organisasi_id: number | null;
    periode: string;
    urutan_tampil: number;
    foto_path: string | null;
    divisi?: { id: number; nama_divisi: string } | null;
};

type Props = {
    divisi: Divisi[];
    pengurus: PengurusItem[];
    periodeList: string[];
    selectedPeriode: string;
    canManage?: boolean;
    isReadOnly?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs font-medium text-[#C4514A]">{message}</p>;
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
            {children}
        </label>
    );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={`w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs sm:text-sm text-[#1E2430] placeholder-[#A8B0BE] shadow-xs outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 disabled:opacity-60 dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:placeholder-[#5A6070] ${className}`}
        />
    );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={`w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs sm:text-sm text-[#1E2430] placeholder-[#A8B0BE] shadow-xs outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:placeholder-[#5A6070] ${className}`}
        />
    );
}

function Select({ className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={`w-full appearance-none rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs sm:text-sm text-[#1E2430] shadow-xs outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B] dark:text-[#E6ECF5] ${className}`}
        />
    );
}

// ─── Modal Tambah/Edit Divisi ─────────────────────────────────────────────────

function DivisiModal({
    teamSlug,
    editing,
    onClose,
}: {
    teamSlug: string;
    editing: Divisi | null;
    onClose: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        nama_divisi: editing?.nama_divisi ?? '',
        deskripsi: editing?.deskripsi ?? '',
        urutan_tampil: editing?.urutan_tampil?.toString() ?? '0',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const url = editing
            ? `/${teamSlug}/pengurus/struktur-organisasi/divisi/${editing.id}`
            : `/${teamSlug}/pengurus/struktur-organisasi/divisi`;

        const method = editing ? patch : post;
        method(url, {
            onSuccess: () => {
                showSuccess(
                    editing ? 'Divisi Diperbarui!' : 'Divisi Ditambahkan!',
                    editing
                        ? `Divisi "${data.nama_divisi}" berhasil diperbarui.`
                        : `Divisi "${data.nama_divisi}" berhasil ditambahkan.`,
                );
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl border border-[rgba(30,36,48,0.10)] bg-white shadow-xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] px-5 py-4 dark:border-[rgba(255,255,255,0.08)]">
                    <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        {editing ? 'Edit Divisi' : 'Tambah Divisi Baru'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4 p-5">
                    <div>
                        <Label htmlFor="divisi-nama">Nama Divisi <span className="text-[#C4514A]">*</span></Label>
                        <Input
                            id="divisi-nama"
                            type="text"
                            placeholder="cth. Divisi Pengembangan SDM"
                            value={data.nama_divisi}
                            onChange={(e) => setData('nama_divisi', e.target.value)}
                            className="mt-1"
                            required
                        />
                        <InputError message={errors.nama_divisi} />
                    </div>

                    <div>
                        <Label htmlFor="divisi-deskripsi">Deskripsi Singkat</Label>
                        <Textarea
                            id="divisi-deskripsi"
                            rows={3}
                            placeholder="Fokus dan ruang lingkup program kerja divisi ini..."
                            value={data.deskripsi}
                            onChange={(e) => setData('deskripsi', e.target.value)}
                            className="mt-1"
                        />
                        <InputError message={errors.deskripsi} />
                    </div>

                    <div>
                        <Label htmlFor="divisi-urutan">Urutan Tampil</Label>
                        <Input
                            id="divisi-urutan"
                            type="number"
                            min="0"
                            value={data.urutan_tampil}
                            onChange={(e) => setData('urutan_tampil', e.target.value)}
                            className="mt-1 font-mono-sigap"
                        />
                        <InputError message={errors.urutan_tampil} />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[rgba(30,36,48,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto rounded-lg bg-[#4A5FD1] px-5 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Divisi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Modal Tambah/Edit Pengurus ───────────────────────────────────────────────

function PengurusModal({
    teamSlug,
    divisiList,
    currentPeriode,
    periodeList,
    editing,
    onClose,
}: {
    teamSlug: string;
    divisiList: Divisi[];
    currentPeriode: string;
    periodeList: string[];
    editing: PengurusItem | null;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        nama: string;
        jabatan: string;
        divisi_organisasi_id: string;
        periode: string;
        urutan_tampil: string;
        foto: File | null;
        _method?: string;
    }>({
        nama: editing?.nama ?? '',
        jabatan: editing?.jabatan ?? '',
        divisi_organisasi_id: editing?.divisi_organisasi_id?.toString() ?? '',
        periode: editing?.periode ?? currentPeriode,
        urutan_tampil: editing?.urutan_tampil?.toString() ?? '0',
        foto: null,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        editing?.foto_path ? `/storage/${editing.foto_path}` : null,
    );

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        setData('foto', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const url = editing
            ? `/${teamSlug}/pengurus/struktur-organisasi/pengurus/${editing.id}`
            : `/${teamSlug}/pengurus/struktur-organisasi/pengurus`;

        if (editing) {
            data._method = 'PATCH';
        }

        post(url, {
            forceFormData: true,
            onSuccess: () => {
                showSuccess(
                    editing ? 'Pengurus Diperbarui!' : 'Pengurus Ditambahkan!',
                    editing
                        ? `Data "${data.nama}" berhasil diperbarui.`
                        : `Pengurus "${data.nama}" berhasil ditambahkan.`,
                );
                reset();
                onClose();
            },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-[rgba(30,36,48,0.10)] bg-white shadow-xl dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] px-5 py-4 dark:border-[rgba(255,255,255,0.08)]">
                    <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        {editing ? 'Edit Anggota Pengurus' : 'Tambah Pengurus Baru'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4 p-5">
                    {/* Foto Upload Preview */}
                    <div>
                        <Label>Foto Profil Pengurus</Label>
                        <div className="mt-2 flex items-center gap-4">
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="size-14 rounded-full object-cover ring-2 ring-[#4A5FD1]/30"
                                />
                            ) : (
                                <div className="flex size-14 items-center justify-center rounded-full bg-[#4A5FD1]/12 font-display text-sm font-bold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    {data.nama ? data.nama.slice(0, 2).toUpperCase() : 'FOTO'}
                                </div>
                            )}
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                                >
                                    <Upload className="size-3.5" />
                                    Pilih Foto
                                </button>
                                <p className="mt-1 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    JPG, PNG, atau WebP (maks. 2MB)
                                </p>
                            </div>
                        </div>
                        <InputError message={errors.foto} />
                    </div>

                    <div>
                        <Label htmlFor="pengurus-nama">Nama Lengkap <span className="text-[#C4514A]">*</span></Label>
                        <Input
                            id="pengurus-nama"
                            type="text"
                            placeholder="cth. Ahmad Fauzi"
                            value={data.nama}
                            onChange={(e) => setData('nama', e.target.value)}
                            className="mt-1"
                            required
                        />
                        <InputError message={errors.nama} />
                    </div>

                    <div>
                        <Label htmlFor="pengurus-jabatan">Jabatan <span className="text-[#C4514A]">*</span></Label>
                        <Input
                            id="pengurus-jabatan"
                            type="text"
                            placeholder="cth. Ketua Umum, Sekretaris I, Koordinator Divisi..."
                            value={data.jabatan}
                            onChange={(e) => setData('jabatan', e.target.value)}
                            className="mt-1"
                            required
                        />
                        <InputError message={errors.jabatan} />
                    </div>

                    <div>
                        <Label htmlFor="pengurus-divisi">Penempatan Divisi / Inti</Label>
                        <div className="relative mt-1">
                            <Select
                                id="pengurus-divisi"
                                value={data.divisi_organisasi_id}
                                onChange={(e) => setData('divisi_organisasi_id', e.target.value)}
                                className="pr-9"
                            >
                                <option value="">Pengurus Inti / Pucuk Pimpinan</option>
                                {divisiList.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.nama_divisi}
                                    </option>
                                ))}
                            </Select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#727C8E]" />
                        </div>
                        <InputError message={errors.divisi_organisasi_id} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="pengurus-periode">Periode</Label>
                            <div className="relative mt-1">
                                <Select
                                    id="pengurus-periode"
                                    value={data.periode}
                                    onChange={(e) => setData('periode', e.target.value)}
                                    className="pr-9 font-mono-sigap"
                                    required
                                >
                                    {periodeList.map((p) => (
                                        <option key={p} value={p}>
                                            Periode {p}
                                        </option>
                                    ))}
                                    {data.periode && !periodeList.includes(data.periode) && (
                                        <option value={data.periode}>
                                            Periode {data.periode}
                                        </option>
                                    )}
                                </Select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#727C8E]" />
                            </div>
                            <InputError message={errors.periode} />
                        </div>
                        <div>
                            <Label htmlFor="pengurus-urutan">Urutan Tampil</Label>
                            <Input
                                id="pengurus-urutan"
                                type="number"
                                min="0"
                                value={data.urutan_tampil}
                                onChange={(e) => setData('urutan_tampil', e.target.value)}
                                className="mt-1 font-mono-sigap"
                            />
                            <InputError message={errors.urutan_tampil} />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[rgba(30,36,48,0.06)] dark:border-[rgba(255,255,255,0.06)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto rounded-lg px-4 py-2 text-xs font-semibold text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto rounded-lg bg-[#2E9E82] px-5 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#26856E] disabled:opacity-50"
                        >
                            {processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Tambah Pengurus'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PengurusStrukturOrganisasiIndex({
    divisi,
    pengurus,
    periodeList,
    selectedPeriode,
    canManage = true,
    isReadOnly = false,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const [periode, setPeriode] = useState(selectedPeriode);

    useEffect(() => {
        setPeriode(selectedPeriode);
    }, [selectedPeriode]);
    const [showDivisiModal, setShowDivisiModal] = useState(false);
    const [editingDivisi, setEditingDivisi] = useState<Divisi | null>(null);
    const [showPengurusModal, setShowPengurusModal] = useState(false);
    const [editingPengurus, setEditingPengurus] = useState<PengurusItem | null>(null);

    function changePeriode(val: string) {
        setPeriode(val);
        router.get(
            `/${teamSlug}/pengurus/struktur-organisasi`,
            { periode: val },
            { preserveScroll: true },
        );
    }

    async function handleDeleteDivisi(d: Divisi) {
        const confirmed = await confirmDelete(
            `divisi "${d.nama_divisi}"`,
            'Pengurus yang berada di dalam divisi ini akan diubah statusnya menjadi Pengurus Inti.',
        );
        if (!confirmed) return;
        router.delete(`/${teamSlug}/pengurus/struktur-organisasi/divisi/${d.id}`, {
            onSuccess: () => showSuccess('Divisi Dihapus', `Divisi "${d.nama_divisi}" berhasil dihapus.`),
        });
    }

    async function handleDeletePengurus(p: PengurusItem) {
        const confirmed = await confirmDelete(
            `${p.nama} dari struktur`,
            'Data jabatan pengurus ini akan dihapus permanen dari struktur organisasi.',
        );
        if (!confirmed) return;
        router.delete(`/${teamSlug}/pengurus/struktur-organisasi/pengurus/${p.id}`, {
            onSuccess: () => showSuccess('Data Dihapus', `${p.nama} berhasil dihapus dari struktur.`),
        });
    }

    return (
        <>
            <Head title="Kelola Struktur Organisasi - SIGAP" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Arsip Periode"
                        message="Mode pemantauan: Struktur organisasi pada periode arsip bersifat read-only. Penambahan divisi dan perubahan pengurus dinonaktifkan."
                    />
                )}

                {/* ── Page Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                                Struktur Organisasi
                            </h1>
                            <span className="rounded-full bg-[#4A5FD1]/10 px-2.5 py-0.5 font-mono-sigap text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                {pengurus.length} Pengurus
                            </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Kelola divisi dan susunan pengurus per periode kepengurusan
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        {/* Periode selector */}
                        <div className="relative w-full sm:w-auto">
                            <Select
                                value={periode}
                                onChange={(e) => changePeriode(e.target.value)}
                                className="w-full sm:w-auto py-2 pl-3 pr-8 text-xs sm:text-sm font-semibold"
                            >
                                {periodeList.length === 0 && (
                                    <option value={periode}>Periode {periode}</option>
                                )}
                                {periodeList.map((p) => (
                                    <option key={p} value={p}>
                                        Periode {p}
                                    </option>
                                ))}
                            </Select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#727C8E]" />
                        </div>
                    </div>
                </div>

                {/* ── Divisi Section ── */}
                <section className="rounded-xl border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(30,36,48,0.08)] p-4 sm:px-5 sm:py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-2">
                            <Layers className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">Divisi & Bidang</h2>
                            <span className="rounded-full bg-[#4A5FD1]/12 px-2 py-0.5 font-mono-sigap text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                {divisi.length}
                            </span>
                        </div>
                        {canManage && (
                            <button
                                id="btn-tambah-divisi"
                                onClick={() => { setEditingDivisi(null); setShowDivisiModal(true); }}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1] px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3A4FBF] w-full sm:w-auto"
                            >
                                <Plus className="size-3.5" />
                                <span>Tambah Divisi</span>
                            </button>
                        )}
                    </div>

                    {divisi.length === 0 ? (
                        <div className="py-10 text-center">
                            <Building2 className="mx-auto mb-2 size-8 text-[#D0D5E0] dark:text-[#3A4055]" />
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">Belum ada divisi yang dibuat.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {divisi.map((d) => (
                                <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 sm:px-5 sm:py-3.5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {d.nama_divisi}
                                        </p>
                                        {d.deskripsi && (
                                            <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8] break-words">
                                                {d.deskripsi}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                        <span className="rounded-md bg-[#F6F7F9] px-2 py-0.5 font-mono-sigap text-[11px] font-medium text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                            {d.pengurus_count} pengurus
                                        </span>
                                        {canManage && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => { setEditingDivisi(d); setShowDivisiModal(true); }}
                                                    className="rounded-md p-1.5 text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                                                    title="Edit divisi"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDivisi(d)}
                                                    className="rounded-md p-1.5 text-[#C4514A] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515]"
                                                    title="Hapus divisi"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Pengurus Section ── */}
                <section className="rounded-xl border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(30,36,48,0.08)] p-4 sm:px-5 sm:py-3.5 dark:border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-2">
                            <Users className="size-4 text-[#2E9E82] dark:text-[#34B394]" />
                            <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Pengurus Periode {periode}
                            </h2>
                            <span className="rounded-full bg-[#2E9E82]/12 px-2 py-0.5 font-mono-sigap text-[11px] font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                {pengurus.length}
                            </span>
                        </div>
                        {canManage && (
                            <button
                                id="btn-tambah-pengurus"
                                onClick={() => { setEditingPengurus(null); setShowPengurusModal(true); }}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2E9E82] px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#26856E] w-full sm:w-auto"
                            >
                                <Plus className="size-3.5" />
                                <span>Tambah Pengurus</span>
                            </button>
                        )}
                    </div>

                    {pengurus.length === 0 ? (
                        <div className="py-10 text-center">
                            <Users className="mx-auto mb-2 size-8 text-[#D0D5E0] dark:text-[#3A4055]" />
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Belum ada anggota pengurus untuk periode ini.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── Mobile View (< 640px) ── */}
                            <div className="sm:hidden divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)] p-3 flex flex-col gap-2.5">
                                {pengurus.map((p) => (
                                    <div
                                        key={p.id}
                                        className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/40 p-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/30 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {p.foto_path ? (
                                                    <img
                                                        src={`/storage/${p.foto_path}`}
                                                        alt={p.nama}
                                                        className="size-9 rounded-full object-cover ring-1 ring-[rgba(30,36,48,0.10)] shrink-0"
                                                    />
                                                ) : (
                                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                        {p.nama.slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-xs text-[#1E2430] dark:text-[#E6ECF5] break-words">
                                                        {p.nama}
                                                    </p>
                                                    <p className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                        {p.jabatan}
                                                    </p>
                                                </div>
                                            </div>

                                            {canManage && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => { setEditingPengurus(p); setShowPengurusModal(true); }}
                                                        className="rounded-md p-1.5 text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePengurus(p)}
                                                        className="rounded-md p-1.5 text-[#C4514A] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515]"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between border-t border-[rgba(30,36,48,0.06)] pt-2 text-[11px] dark:border-[rgba(255,255,255,0.06)]">
                                            {p.divisi ? (
                                                <span className="rounded-md bg-[#4A5FD1]/10 px-2 py-0.5 text-[10px] font-medium text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                    {p.divisi.nama_divisi}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#2E9E82] dark:text-[#34B394]">
                                                    <ShieldCheck className="size-3" />
                                                    Pengurus Inti
                                                </span>
                                            )}
                                            <span className="font-mono-sigap text-[10px] text-[#727C8E]">
                                                Urutan: #{p.urutan_tampil}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Desktop Tabular View (≥ 640px) ── */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-[rgba(30,36,48,0.06)] bg-[#F6F7F9] text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:border-[rgba(255,255,255,0.06)] dark:bg-[#121620] dark:text-[#8C97A8]">
                                            <th className="px-5 py-3 text-left">Nama</th>
                                            <th className="px-5 py-3 text-left">Jabatan</th>
                                            <th className="px-5 py-3 text-left">Divisi</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(30,36,48,0.05)] dark:divide-[rgba(255,255,255,0.05)]">
                                        {pengurus.map((p) => (
                                            <tr key={p.id} className="hover:bg-[#FAFBFC] dark:hover:bg-[#1A2030]">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        {p.foto_path ? (
                                                            <img
                                                                src={`/storage/${p.foto_path}`}
                                                                alt={p.nama}
                                                                className="size-8 rounded-full object-cover ring-1 ring-[rgba(30,36,48,0.10)] shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#4A5FD1]/12 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                                {p.nama.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                            {p.nama}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-[#4A5060] dark:text-[#9BA4B4]">{p.jabatan}</td>
                                                <td className="px-5 py-3">
                                                    {p.divisi ? (
                                                        <span className="rounded-md bg-[#4A5FD1]/10 px-2 py-0.5 text-xs font-medium text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                                            {p.divisi.nama_divisi}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#2E9E82] dark:text-[#34B394]">
                                                            <ShieldCheck className="size-3" />
                                                            Pengurus Inti
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {canManage ? (
                                                        <div className="inline-flex items-center gap-1">
                                                            <button
                                                                onClick={() => { setEditingPengurus(p); setShowPengurusModal(true); }}
                                                                className="rounded-md p-1.5 text-[#727C8E] hover:bg-[#F6F7F9] dark:hover:bg-[#21293A]"
                                                                title="Edit"
                                                            >
                                                                <Pencil className="size-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePengurus(p)}
                                                                className="rounded-md p-1.5 text-[#C4514A] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515]"
                                                                title="Hapus"
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
                </section>

                {/* ── Modals ── */}
                {showDivisiModal && (
                    <DivisiModal
                        teamSlug={teamSlug}
                        editing={editingDivisi}
                        onClose={() => { setShowDivisiModal(false); setEditingDivisi(null); }}
                    />
                )}
                {showPengurusModal && (
                    <PengurusModal
                        teamSlug={teamSlug}
                        divisiList={divisi}
                        currentPeriode={periode}
                        periodeList={periodeList}
                        editing={editingPengurus}
                        onClose={() => { setShowPengurusModal(false); setEditingPengurus(null); }}
                    />
                )}
            </div>
        </>
    );
}

PengurusStrukturOrganisasiIndex.layout = (props: { currentTeam?: { slug: string } | null }) => ({
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
        },
    ],
});
