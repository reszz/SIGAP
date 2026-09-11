import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    FileText,
    Inbox,
    Send,
    Plus,
    Pencil,
    Trash2,
    X,
    Download,
    ChevronDown,
    FileUp,
    Mail,
    MailOpen,
    Check,
    Calendar,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';

// ─── Types ────────────────────────────────────────────────────────────────────

type KegiatanOption = { id: number; nama: string; warna: string | null };

type SuratItem = {
    id: number;
    tipe: 'masuk' | 'keluar';
    nomor_surat: string;
    jenis_surat: string;
    perihal: string;
    tanggal_surat: string;
    pengirim_penerima: string;
    keterangan: string | null;
    has_file: boolean;
    file_url: string | null;
    dibuat_oleh: string | null;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    surat: SuratItem[];
    filterTipe: 'masuk' | 'keluar' | null;
    canManageMasuk: boolean;
    canManageKeluar: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>;
}

function TipeBadge({ tipe }: { tipe: 'masuk' | 'keluar' }) {
    return tipe === 'masuk' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
            <Inbox className="size-3.5" /> Masuk
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Send className="size-3.5" /> Keluar
        </span>
    );
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

function SuratModal({
    teamSlug,
    kegiatanId,
    canManageMasuk,
    canManageKeluar,
    editSurat,
    onClose,
}: {
    teamSlug: string;
    kegiatanId: number;
    canManageMasuk: boolean;
    canManageKeluar: boolean;
    editSurat: SuratItem | null;
    onClose: () => void;
}) {
    const defaultTipe = editSurat?.tipe ?? (canManageMasuk ? 'masuk' : 'keluar');

    const { data, setData, post, processing, errors, reset } = useForm<{
        tipe: 'masuk' | 'keluar';
        nomor_surat: string;
        jenis_surat: string;
        perihal: string;
        tanggal_surat: string;
        pengirim_penerima: string;
        keterangan: string;
        file: File | null;
    }>({
        tipe: defaultTipe,
        nomor_surat: editSurat?.nomor_surat ?? '',
        jenis_surat: editSurat?.jenis_surat ?? '',
        perihal: editSurat?.perihal ?? '',
        tanggal_surat: editSurat?.tanggal_surat ?? '',
        pengirim_penerima: editSurat?.pengirim_penerima ?? '',
        keterangan: editSurat?.keterangan ?? '',
        file: null,
    });

    const isEditing = !!editSurat;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const url = editSurat
            ? `/${teamSlug}/surat/${editSurat.id}`
            : `/${teamSlug}/surat/${kegiatanId}`;

        const opts = {
            forceFormData: true,
            onSuccess: () => {
                showSuccess(
                    isEditing ? 'Surat Diperbarui!' : 'Surat Ditambahkan!',
                    isEditing
                        ? 'Perubahan berkas arsip surat telah disimpan.'
                        : 'Berkas arsip surat baru telah tercatat di sistem.',
                );
                reset();
                onClose();
            },
        };

        if (editSurat) {
            // PATCH dengan _method spoofing via forceFormData
            post(url + '?_method=PATCH', opts);
        } else {
            post(url, opts);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/45 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 max-h-[90vh] overflow-y-auto">
                <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                            <Mail className="size-4" />
                        </div>
                        <div>
                            <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                                {isEditing ? 'Edit Arsip Surat' : 'Tambah Arsip Surat'}
                            </h2>
                            <p className="text-xs text-neutral-400">
                                {isEditing ? 'Perbarui rincian arsip surat' : 'Catat surat masuk atau surat keluar baru'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-4">
                    {/* Tipe Surat */}
                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Tipe Surat <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {canManageMasuk && (
                                <button
                                    type="button"
                                    onClick={() => !isEditing && setData('tipe', 'masuk')}
                                    disabled={isEditing}
                                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                                        data.tipe === 'masuk'
                                            ? 'border-blue-500 bg-blue-50/70 text-blue-700 ring-2 ring-blue-500/20 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                    }`}
                                >
                                    <Inbox className="size-4" />
                                    <span>Surat Masuk</span>
                                </button>
                            )}
                            {canManageKeluar && (
                                <button
                                    type="button"
                                    onClick={() => !isEditing && setData('tipe', 'keluar')}
                                    disabled={isEditing}
                                    className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                                        data.tipe === 'keluar'
                                            ? 'border-emerald-500 bg-emerald-50/70 text-emerald-700 ring-2 ring-emerald-500/20 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
                                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                    }`}
                                >
                                    <Send className="size-4" />
                                    <span>Surat Keluar</span>
                                </button>
                            )}
                        </div>
                        <InputError message={errors.tipe} />
                    </div>

                    {/* Field input */}
                    {[
                        { key: 'nomor_surat', label: 'Nomor Surat', placeholder: 'Contoh: 001/SIGAP/VIII/2026' },
                        { key: 'jenis_surat', label: 'Jenis / Klasifikasi Surat', placeholder: 'Contoh: Undangan, Permohonan Izin, Pemberitahuan' },
                        { key: 'perihal', label: 'Perihal Surat', placeholder: 'Contoh: Undangan Pemateri Seminar Nasional' },
                        {
                            key: 'pengirim_penerima',
                            label: data.tipe === 'masuk' ? 'Pengirim Surat' : 'Penerima / Tujuan Surat',
                            placeholder: data.tipe === 'masuk' ? 'Contoh: BEM Fakultas Teknik' : 'Contoh: Dekan Fakultas Ilmu Komputer',
                        },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                {label} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data[key as keyof typeof data] as string}
                                onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                placeholder={placeholder}
                                className="w-full rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                            />
                            <InputError message={errors[key as keyof typeof errors]} />
                        </div>
                    ))}

                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Tanggal Surat <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_surat}
                            onChange={(e) => setData('tanggal_surat', e.target.value)}
                            className="font-mono-sigap w-full rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        />
                        <InputError message={errors.tanggal_surat} />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Keterangan / Catatan Tambahan
                        </label>
                        <textarea
                            value={data.keterangan}
                            onChange={(e) => setData('keterangan', e.target.value)}
                            rows={3}
                            placeholder="Catatan tambahan, disposisi, atau keterangan nomor arsip..."
                            className="w-full rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 text-xs text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 resize-none"
                        />
                        <InputError message={errors.keterangan} />
                    </div>

                    {/* Upload berkas */}
                    <div>
                        <label className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Unggah Dokumen Berkas (PDF, DOC — Max 20MB)
                        </label>
                        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-2 dark:border-neutral-700 dark:bg-neutral-800/40">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.odt"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                className="w-full text-xs text-neutral-600 dark:text-neutral-300 file:mr-3 file:rounded-xl file:border-0 file:bg-[#EEF2FF] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#4F46E5] hover:file:bg-[#E0E7FF] dark:file:bg-[#4F46E5]/20 dark:file:text-[#818CF8]"
                            />
                        </div>
                        <InputError message={errors.file} />
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-1.5 rounded-2xl bg-[#4F46E5] px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#4F46E5]/25 transition hover:bg-[#4338CA] disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            {processing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Surat'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuratIndex({
    kegiatanList,
    selectedKegiatanId,
    surat,
    filterTipe,
    canManageMasuk,
    canManageKeluar,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const [showModal, setShowModal] = useState(false);
    const [editSurat, setEditSurat] = useState<SuratItem | null>(null);

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId);

    function pilihKegiatan(id: number) {
        router.get(`/${teamSlug}/surat`, { kegiatan_id: id }, { preserveState: false });
    }

    function pilihFilter(tipe: 'masuk' | 'keluar' | null) {
        router.get(
            `/${teamSlug}/surat`,
            { kegiatan_id: selectedKegiatanId, tipe: tipe ?? undefined },
            { preserveState: true, replace: true },
        );
    }

    function openAdd(tipe?: 'masuk' | 'keluar') {
        setEditSurat(null);
        setShowModal(true);
    }

    function openEdit(s: SuratItem) {
        setEditSurat(s);
        setShowModal(true);
    }

    async function hapusSurat(id: number) {
        const confirmed = await confirmDelete('Surat', 'Yakin ingin menghapus berkas arsip surat ini?');
        if (!confirmed) return;
        router.delete(`/${teamSlug}/surat/${id}`, {
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: 'Surat berhasil dihapus.',
                });
            },
        });
    }

    const canManageAny = canManageMasuk || canManageKeluar;

    const countMasuk = surat.filter((s) => s.tipe === 'masuk').length;
    const countKeluar = surat.filter((s) => s.tipe === 'keluar').length;

    return (
        <>
            <Head title="Surat Menyurat" />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ── Header & Kegiatan Selector ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-2.5 py-0.5 text-[11px] font-bold text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                <FileText className="size-3" />
                                <span>Administrasi Dokumen</span>
                            </span>
                        </div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Surat Menyurat
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Kelola arsip surat masuk dan surat keluar resmi kegiatan
                        </p>
                    </div>

                    {/* Selector Kegiatan */}
                    {kegiatanList.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) => pilihKegiatan(Number(e.target.value))}
                                className="appearance-none rounded-2xl border border-neutral-200/80 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                            >
                                <option value="" disabled>
                                    Pilih Kegiatan
                                </option>
                                {kegiatanList.map((k) => (
                                    <option key={k.id} value={k.id}>
                                        {k.nama}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4 text-neutral-400" />
                        </div>
                    )}
                </div>

                {/* ── Belum Pilih Kegiatan Empty State ── */}
                {!selectedKegiatan && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex size-14 items-center justify-center rounded-3xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8] mb-3">
                            <Mail className="size-7" />
                        </div>
                        <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                            Pilih Kegiatan Terlebih Dahulu
                        </h3>
                        <p className="max-w-xs text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {kegiatanList.length === 0
                                ? 'Kamu belum memiliki akses ke surat menyurat kegiatan manapun.'
                                : 'Pilih kegiatan di pojok kanan atas untuk melihat dan mengarsipkan surat.'}
                        </p>
                    </div>
                )}

                {selectedKegiatan && (
                    <>
                        {/* ── 3 Summary KPI Tiles ── */}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="flex items-center gap-3.5 rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                    <Mail className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                                        Total Surat
                                    </p>
                                    <p className="font-display text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {surat.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                    <Inbox className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                                        Surat Masuk
                                    </p>
                                    <p className="font-display text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {countMasuk}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 rounded-3xl border border-neutral-200/70 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                    <Send className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                                        Surat Keluar
                                    </p>
                                    <p className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {countKeluar}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Table & Filter Card ── */}
                        <div className="rounded-3xl border border-neutral-200/70 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                            {/* Filter Tabs + Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-neutral-100 dark:border-neutral-800">
                                {/* Segmented Filter Tabs */}
                                <div className="flex items-center rounded-2xl border border-neutral-200/80 bg-neutral-50/60 p-1 dark:border-neutral-700/60 dark:bg-neutral-800/40">
                                    {[
                                        { label: 'Semua Surat', value: null },
                                        { label: `Masuk (${countMasuk})`, value: 'masuk' },
                                        { label: `Keluar (${countKeluar})`, value: 'keluar' },
                                    ].map(({ label, value }) => (
                                        <button
                                            key={label}
                                            onClick={() => pilihFilter(value as 'masuk' | 'keluar' | null)}
                                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                filterTipe === value
                                                    ? 'bg-[#4F46E5] text-white shadow-xs'
                                                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tombol Tambah */}
                                {canManageAny && (
                                    <div className="flex items-center gap-2">
                                        {canManageMasuk && (
                                            <button
                                                id="btn-tambah-surat-masuk"
                                                onClick={() => openAdd('masuk')}
                                                className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Surat Masuk</span>
                                            </button>
                                        )}
                                        {canManageKeluar && (
                                            <button
                                                id="btn-tambah-surat-keluar"
                                                onClick={() => openAdd('keluar')}
                                                className="flex items-center gap-1.5 rounded-2xl bg-[#10B981] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#059669]"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Surat Keluar</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Table Content */}
                            {surat.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400 dark:bg-neutral-800">
                                        <MailOpen className="size-7" />
                                    </div>
                                    <h3 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                                        Belum Ada Surat {filterTipe ? `(${filterTipe})` : ''}
                                    </h3>
                                    <p className="max-w-xs text-xs text-neutral-500 dark:text-neutral-400">
                                        Belum ada dokumen surat yang dicatat untuk kegiatan ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-neutral-100 bg-neutral-50/50 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:bg-neutral-800/40">
                                                <th className="px-5 py-3">Tipe</th>
                                                <th className="px-5 py-3">Nomor Surat</th>
                                                <th className="px-5 py-3">Jenis</th>
                                                <th className="px-5 py-3 min-w-[200px]">Perihal</th>
                                                <th className="px-5 py-3">Tanggal</th>
                                                <th className="px-5 py-3">Pengirim / Tujuan</th>
                                                <th className="px-5 py-3">Berkas</th>
                                                <th className="px-5 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            {surat.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="transition hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40"
                                                >
                                                    <td className="px-5 py-3.5">
                                                        <TipeBadge tipe={s.tipe} />
                                                    </td>
                                                    <td className="font-mono-sigap px-5 py-3.5 font-bold text-neutral-800 dark:text-neutral-200">
                                                        {s.nomor_surat}
                                                    </td>
                                                    <td className="px-5 py-3.5 font-medium text-neutral-700 dark:text-neutral-300">
                                                        {s.jenis_surat}
                                                    </td>
                                                    <td className="px-5 py-3.5 max-w-xs">
                                                        <p className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                                            {s.perihal}
                                                        </p>
                                                        {s.keterangan && (
                                                            <p className="mt-0.5 text-[11px] text-neutral-400 line-clamp-1">
                                                                {s.keterangan}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="font-mono-sigap px-5 py-3.5 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="size-3 text-neutral-400" />
                                                            <span>{s.tanggal_surat}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-medium text-neutral-700 dark:text-neutral-300">
                                                        {s.pengirim_penerima}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {s.has_file ? (
                                                            <a
                                                                href={s.file_url!}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-700 transition hover:bg-[#EEF2FF] hover:text-[#4F46E5] dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-[#4F46E5]/20 dark:hover:text-[#818CF8]"
                                                            >
                                                                <Download className="size-3" />
                                                                Unduh
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-neutral-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {((s.tipe === 'masuk' && canManageMasuk) ||
                                                                (s.tipe === 'keluar' && canManageKeluar)) && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openEdit(s)}
                                                                        title="Edit surat"
                                                                        className="rounded-xl p-1.5 text-neutral-400 transition hover:bg-[#EEF2FF] hover:text-[#4F46E5] dark:hover:bg-[#4F46E5]/20 dark:hover:text-[#818CF8]"
                                                                    >
                                                                        <Pencil className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => hapusSurat(s.id)}
                                                                        title="Hapus surat"
                                                                        className="rounded-xl p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ─── Modal ────────────────────────────────────────────────────── */}
            {showModal && selectedKegiatanId && (
                <SuratModal
                    teamSlug={teamSlug}
                    kegiatanId={selectedKegiatanId}
                    canManageMasuk={canManageMasuk}
                    canManageKeluar={canManageKeluar}
                    editSurat={editSurat}
                    onClose={() => {
                        setShowModal(false);
                        setEditSurat(null);
                    }}
                />
            )}
        </>
    );
}
