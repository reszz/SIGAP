import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Inbox,
    Send,
    Plus,
    Pencil,
    Trash2,
    X,
    Download,
    ChevronDown,
    Mail,
    MailOpen,
    Check,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';
import {kegiatanBreadcrumbs} from '@/lib/breadcrumbs';
import { confirmDelete, showSuccess, Toast } from '@/lib/sweetalert';
import { index as suratIndex } from '@/routes/surat';
import { index as panitiaIndex } from '@/routes/panitia';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';

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
    isReadOnly?: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InputError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-[#C4514A] font-medium">{message}</p>;
}

function TipeBadge({ tipe }: { tipe: 'masuk' | 'keluar' }) {
    return tipe === 'masuk' ? (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#4A5FD1]/12 px-2 py-0.5 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
            <Inbox className="size-3" /> Masuk
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2E9E82]/12 px-2 py-0.5 text-xs font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
            <Send className="size-3" /> Keluar
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
            post(url + '?_method=PATCH', opts);
        } else {
            post(url, opts);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-lg border border-[rgba(30,36,48,0.12)] bg-white p-6 shadow-xl dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] max-h-[90vh] overflow-y-auto">
                <div className="mb-5 flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            <Mail className="size-4" />
                        </div>
                        <div>
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {isEditing ? 'Edit Arsip Surat' : 'Tambah Arsip Surat'}
                            </h2>
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {isEditing ? 'Perbarui rincian arsip surat' : 'Catat surat masuk atau surat keluar baru'}
                            </p>
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
                    {/* Tipe Surat */}
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                            Tipe Surat <span className="text-[#C4514A]">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {canManageMasuk && (
                                <button
                                    type="button"
                                    onClick={() => !isEditing && setData('tipe', 'masuk')}
                                    disabled={isEditing}
                                    className={`flex items-center justify-center gap-2 rounded-md border p-2.5 text-xs font-semibold transition-all ${
                                        data.tipe === 'masuk'
                                            ? 'border-[#4A5FD1] bg-[#4A5FD1]/10 text-[#4A5FD1] dark:border-[#8FA0FA] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]'
                                            : 'border-[rgba(30,36,48,0.12)] bg-white text-[#727C8E] hover:border-[rgba(30,36,48,0.2)] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8C97A8]'
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
                                    className={`flex items-center justify-center gap-2 rounded-md border p-2.5 text-xs font-semibold transition-all ${
                                        data.tipe === 'keluar'
                                            ? 'border-[#2E9E82] bg-[#2E9E82]/10 text-[#2E9E82] dark:border-[#34B394] dark:bg-[#2E9E82]/20 dark:text-[#34B394]'
                                            : 'border-[rgba(30,36,48,0.12)] bg-white text-[#727C8E] hover:border-[rgba(30,36,48,0.2)] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8C97A8]'
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
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                {label} <span className="text-[#C4514A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={data[key as keyof typeof data] as string}
                                onChange={(e) => setData(key as keyof typeof data, e.target.value)}
                                placeholder={placeholder}
                                className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                            />
                            <InputError message={errors[key as keyof typeof errors]} />
                        </div>
                    ))}

                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                            Tanggal Surat <span className="text-[#C4514A]">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.tanggal_surat}
                            onChange={(e) => setData('tanggal_surat', e.target.value)}
                            className="font-mono-sigap w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                        />
                        <InputError message={errors.tanggal_surat} />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                            Keterangan / Catatan Tambahan
                        </label>
                        <textarea
                            value={data.keterangan}
                            onChange={(e) => setData('keterangan', e.target.value)}
                            rows={3}
                            placeholder="Catatan tambahan, disposisi, atau keterangan nomor arsip..."
                            className="w-full rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-2 text-xs text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] resize-none"
                        />
                        <InputError message={errors.keterangan} />
                    </div>

                    {/* Upload berkas */}
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                            Unggah Dokumen Berkas (PDF, DOC — Max 20MB)
                        </label>
                        <div className="flex items-center gap-2 rounded-md border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/50 p-2 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/40">
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.odt"
                                onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                                className="w-full text-xs text-[#727C8E] dark:text-[#8C97A8] file:mr-3 file:rounded-md file:border-0 file:bg-[#4A5FD1]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#4A5FD1] hover:file:bg-[#4A5FD1]/20 dark:file:bg-[#4A5FD1]/20 dark:file:text-[#8FA0FA]"
                            />
                        </div>
                        <InputError message={errors.file} />
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2 pt-2 border-t border-[rgba(30,36,48,0.08)] dark:border-[rgba(255,255,255,0.08)]">
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
    isReadOnly,
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

    const canManageAny = !isReadOnly && (canManageMasuk || canManageKeluar);

    const countMasuk = surat.filter((s) => s.tipe === 'masuk').length;
    const countKeluar = surat.filter((s) => s.tipe === 'keluar').length;

    return (
        <>
            <Head title="Surat Menyurat" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan surat menyurat. Arsip surat masuk dan keluar ditampilkan untuk keperluan monitoring tanpa akses perubahan."
                    />
                )}

                {/* ── Header & Kegiatan Selector ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Surat Menyurat
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Kelola arsip surat masuk dan surat keluar resmi kegiatan
                        </p>
                    </div>

                    {/* Selector Kegiatan */}
                    {kegiatanList.length > 0 && (
                        <div className="relative min-w-56">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) => pilihKegiatan(Number(e.target.value))}
                                className="w-full appearance-none rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2 pl-3.5 pr-9 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
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
                            <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-[#727C8E]" />
                        </div>
                    )}
                </div>

                {/* ── Belum Pilih Kegiatan Empty State ── */}
                {kegiatanList.length === 0 ? (
                    <AccessRestrictionCard actionType="surat" />
                ) : !selectedKegiatan && (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <div className="flex size-12 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA] mb-3">
                            <Mail className="size-6" />
                        </div>
                        <h3 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Pilih Kegiatan Terlebih Dahulu
                        </h3>
                        <p className="max-w-xs text-xs text-[#727C8E] dark:text-[#8C97A8] mt-1">
                            Pilih kegiatan di pojok kanan atas untuk melihat dan mengarsipkan surat.
                        </p>
                    </div>
                )}

                {selectedKegiatan && (
                    <>
                        {/* ── 3 Summary KPI Tiles ── */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="flex size-10 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <Mail className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                        Total Surat
                                    </p>
                                    <p className="font-display font-mono-sigap text-2xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {surat.length}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="flex size-10 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    <Inbox className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                        Surat Masuk
                                    </p>
                                    <p className="font-display font-mono-sigap text-2xl font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                        {countMasuk}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="flex size-10 items-center justify-center rounded-md bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                    <Send className="size-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]">
                                        Surat Keluar
                                    </p>
                                    <p className="font-display font-mono-sigap text-2xl font-semibold text-[#2E9E82] dark:text-[#34B394]">
                                        {countKeluar}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Table & Filter Card ── */}
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {/* Filter Tabs + Action Buttons */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-[rgba(30,36,48,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                                {/* Segmented Filter Tabs */}
                                <div className="flex items-center rounded-md border border-[rgba(30,36,48,0.12)] bg-[#F6F7F9]/60 p-1 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A]/40">
                                    {[
                                        { label: 'Semua Surat', value: null },
                                        { label: `Masuk (${countMasuk})`, value: 'masuk' },
                                        { label: `Keluar (${countKeluar})`, value: 'keluar' },
                                    ].map(({ label, value }) => (
                                        <button
                                            key={label}
                                            onClick={() => pilihFilter(value as 'masuk' | 'keluar' | null)}
                                            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                                                filterTipe === value
                                                    ? 'bg-[#4A5FD1] text-white shadow-xs'
                                                    : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
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
                                                className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3B4DB8]"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Surat Masuk</span>
                                            </button>
                                        )}
                                        {canManageKeluar && (
                                            <button
                                                id="btn-tambah-surat-keluar"
                                                onClick={() => openAdd('keluar')}
                                                className="flex items-center gap-1.5 rounded-lg bg-[#2E9E82] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#27866F]"
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
                                    <div className="flex size-12 items-center justify-center rounded-md bg-[#F6F7F9] text-[#727C8E] dark:bg-[#21293A] dark:text-[#8C97A8]">
                                        <MailOpen className="size-6" />
                                    </div>
                                    <h3 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        Belum Ada Surat {filterTipe ? `(${filterTipe})` : ''}
                                    </h3>
                                    <p className="max-w-xs text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                        Belum ada dokumen surat yang dicatat untuk kegiatan ini.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/60 text-[11px] font-semibold uppercase tracking-wider text-[#727C8E] dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40 dark:text-[#8C97A8]">
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
                                        <tbody className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                                            {surat.map((s) => (
                                                <tr
                                                    key={s.id}
                                                    className="transition hover:bg-[#F6F7F9]/50 dark:hover:bg-[#21293A]/30"
                                                >
                                                    <td className="px-5 py-3">
                                                        <TipeBadge tipe={s.tipe} />
                                                    </td>
                                                    <td className="font-mono-sigap px-5 py-3 font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {s.nomor_surat}
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                                        {s.jenis_surat}
                                                    </td>
                                                    <td className="px-5 py-3 max-w-xs">
                                                        <p className="font-semibold text-[#1E2430] dark:text-[#E6ECF5] line-clamp-2">
                                                            {s.perihal}
                                                        </p>
                                                        {s.keterangan && (
                                                            <p className="mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8] line-clamp-1">
                                                                {s.keterangan}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="font-mono-sigap px-5 py-3 whitespace-nowrap text-[#727C8E] dark:text-[#8C97A8]">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="size-3 text-[#727C8E]" />
                                                            <span>{s.tanggal_surat}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                                        {s.pengirim_penerima}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {s.has_file ? (
                                                            <a
                                                                href={s.file_url!}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-2.5 py-1 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                                            >
                                                                <Download className="size-3 text-[#4A5FD1]" />
                                                                Unduh
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-[#727C8E]/60">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {((s.tipe === 'masuk' && canManageMasuk) ||
                                                                (s.tipe === 'keluar' && canManageKeluar)) && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openEdit(s)}
                                                                        title="Edit surat"
                                                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#4A5FD1]/10 hover:text-[#4A5FD1]"
                                                                    >
                                                                        <Pencil className="size-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => hapusSurat(s.id)}
                                                                        title="Hapus surat"
                                                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
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

SuratIndex.layout = (page: Props & {
    currentTeam?: {slug: string} | null;
})=> {
    const teamSlug = page.currentTeam?.slug ?? '';
    const selectedKegiatan = page.kegiatanList.find(
        (k) => k.id === page.selectedKegiatanId,
    );

    return {
        breadcrumbs: kegiatanBreadcrumbs(
            'Kegiatan',
            teamSlug ? suratIndex.url(teamSlug) : '/kegiatan',
            {
                title: 'Surat Menyurat',
                href: teamSlug ? panitiaIndex.url(teamSlug) : '/surat',
            },
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },
        ),
    };
};
