import { Head, router, usePage } from '@inertiajs/react';
import { ChevronDown, Download, FileText, ImageIcon, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { index as dokumentasiIndex } from '@/routes/dokumentasi';
import { store, destroy } from '@/routes/dokumentasi';
import { download as dokumentasiDownload } from '@/routes/dokumentasi';
import { confirmDelete, Toast } from '@/lib/sweetalert';

// ─── Types ────────────────────────────────────────────────────────────────────

type KegiatanOption = { id: number; nama: string; warna: string | null };

type DokItem = {
    id: number;
    tipe: 'foto' | 'notulen';
    file_path: string;
    filename: string;
    uploaded_by: string;
    created_at: string;
};

type Props = {
    kegiatanList: KegiatanOption[];
    selectedKegiatanId: number | null;
    dokumentasi: DokItem[];
    canUploadFoto: boolean;
    canUploadNotulen: boolean;
};

// ─── Upload Form ──────────────────────────────────────────────────────────────

function UploadForm({
    teamSlug,
    kegiatanId,
    canUploadFoto,
    canUploadNotulen,
}: {
    teamSlug: string;
    kegiatanId: number;
    canUploadFoto: boolean;
    canUploadNotulen: boolean;
}) {
    const defaultTipe: 'foto' | 'notulen' = canUploadFoto ? 'foto' : 'notulen';
    const [tipe, setTipe] = useState<'foto' | 'notulen'>(defaultTipe);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const acceptAttr = tipe === 'foto' ? 'image/*' : '.pdf,.doc,.docx,.odt';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) {
            setError('Pilih file terlebih dahulu.');
            return;
        }
        setError(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('tipe', tipe);
        formData.append('file', file);

        router.post(store.url({ current_team: teamSlug, kegiatan: kegiatanId }), formData as any, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: `Berkas ${tipe === 'foto' ? 'foto dokumentasi' : 'notulen acara'} berhasil diunggah!`,
                });
                setFile(null);
                if (inputRef.current) inputRef.current.value = '';
            },
            onError: (errors) => {
                setError(Object.values(errors).join(', '));
            },
            onFinish: () => setUploading(false),
        });
    }

    return (
        <form
            onSubmit={submit}
            className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
            <h3 className="font-display mb-4 text-base font-bold text-neutral-900 dark:text-neutral-100">
                Upload Berkas Baru
            </h3>

            <div className="flex flex-wrap items-end gap-4">
                {/* Tipe radio */}
                <div>
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Tipe Dokumen <span className="text-red-500">*</span>
                    </p>
                    <div className="flex gap-4">
                        {canUploadFoto && (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="tipe"
                                    value="foto"
                                    checked={tipe === 'foto'}
                                    onChange={() => { setTipe('foto'); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                                    className="text-[#4F46E5] focus:ring-[#4F46E5]"
                                />
                                <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    <ImageIcon className="size-4 text-[#4F46E5]" /> Foto Dokumentasi
                                </span>
                            </label>
                        )}
                        {canUploadNotulen && (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="tipe"
                                    value="notulen"
                                    checked={tipe === 'notulen'}
                                    onChange={() => { setTipe('notulen'); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                                    className="text-[#4F46E5] focus:ring-[#4F46E5]"
                                />
                                <span className="flex items-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                                    <FileText className="size-4 text-blue-500" /> Notulen Acara
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* File input */}
                <div className="flex-1 min-w-56">
                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                        Pilih File <span className="text-red-500">*</span>
                        {tipe === 'foto' && (
                            <span className="ml-1 font-normal text-neutral-400">(gambar JPG/PNG, max 10 MB)</span>
                        )}
                        {tipe === 'notulen' && (
                            <span className="ml-1 font-normal text-neutral-400">(PDF/DOC/DOCX, max 20 MB)</span>
                        )}
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={acceptAttr}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="w-full text-xs text-neutral-600 dark:text-neutral-400 file:mr-3 file:rounded-xl file:border-0 file:bg-[#EEF2FF] file:px-3.5 file:py-2 file:text-xs file:font-bold file:text-[#4F46E5] hover:file:bg-[#E0E7FF] dark:file:bg-[#4F46E5]/20 dark:file:text-[#818CF8]"
                    />
                    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file}
                    className="flex items-center gap-1.5 rounded-2xl bg-[#4F46E5] px-5 py-2.5 text-xs font-bold text-white shadow-sm shadow-[#4F46E5]/25 transition hover:bg-[#4338CA] disabled:opacity-50"
                >
                    <Upload className="size-4" />
                    {uploading ? 'Mengunggah...' : 'Upload Berkas'}
                </button>
            </div>
        </form>
    );
}

// ─── File List ────────────────────────────────────────────────────────────────

function DokList({
    items,
    tipe,
    teamSlug,
    canDelete,
}: {
    items: DokItem[];
    tipe: 'foto' | 'notulen';
    teamSlug: string;
    canDelete: boolean;
}) {
    async function hapus(id: number) {
        const confirmed = await confirmDelete('File Dokumentasi', 'Yakin ingin menghapus berkas ini?');
        if (!confirmed) return;
        router.delete(destroy.url({ current_team: teamSlug, dokumentasi: id }), {
            preserveScroll: true,
            onSuccess: () => {
                Toast.fire({
                    icon: 'success',
                    title: 'Berkas berhasil dihapus.',
                });
            },
        });
    }

    if (items.length === 0) {
        return (
            <p className="mt-4 text-xs italic text-neutral-400">
                Belum ada berkas {tipe === 'foto' ? 'foto' : 'notulen'}.
            </p>
        );
    }

    return (
        <div className="mt-4 flex flex-col gap-2.5">
            {items.map((d) => (
                <div
                    key={d.id}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-3 text-xs transition hover:border-[#4F46E5]/40 hover:bg-white dark:border-neutral-800 dark:bg-neutral-800/40 dark:hover:bg-neutral-900"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                            {tipe === 'foto' ? (
                                <ImageIcon className="size-4" />
                            ) : (
                                <FileText className="size-4" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate font-bold text-neutral-800 transition group-hover:text-[#4F46E5] dark:text-neutral-200">
                                {d.filename}
                            </p>
                            <p className="text-[11px] text-neutral-400">
                                Diunggah oleh: {d.uploaded_by} • {d.created_at}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                        <a
                            href={dokumentasiDownload.url({ current_team: teamSlug, dokumentasi: d.id })}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 shadow-2xs transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                            <Download className="size-3.5 text-[#4F46E5]" />
                            Unduh
                        </a>
                        {canDelete && (
                            <button
                                onClick={() => hapus(d.id)}
                                title="Hapus berkas"
                                className="rounded-xl p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DokumentasiIndex({
    kegiatanList,
    selectedKegiatanId,
    dokumentasi,
    canUploadFoto,
    canUploadNotulen,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const canUploadAny = canUploadFoto || canUploadNotulen;

    const fotoList = dokumentasi.filter((d) => d.tipe === 'foto');
    const notulenList = dokumentasi.filter((d) => d.tipe === 'notulen');

    function pilihKegiatan(id: number) {
        router.get(dokumentasiIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    return (
        <>
            <Head title="Dokumentasi & Berkas" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
                            Dokumentasi & Berkas
                        </h1>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                            Arsip foto kegiatan dan notulen pertanggungjawaban
                        </p>
                    </div>

                    {kegiatanList.length > 0 && (
                        <div className="relative min-w-56">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) => pilihKegiatan(Number(e.target.value))}
                                className="w-full appearance-none rounded-2xl border border-neutral-200/70 bg-white py-2.5 pl-4 pr-10 text-xs font-bold text-neutral-800 shadow-2xs focus:border-[#4F46E5] focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
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

                {/* ─── Belum pilih kegiatan ─── */}
                {!selectedKegiatan ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <FileText className="mb-4 size-12 text-neutral-300 dark:text-neutral-700" />
                        <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {kegiatanList.length === 0
                                ? 'Kamu belum memiliki akses dokumentasi untuk kegiatan manapun.'
                                : 'Pilih kegiatan di atas untuk melihat dokumentasi & notulen.'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Grid Foto + Notulen */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Foto */}
                            <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5] dark:bg-[#4F46E5]/20 dark:text-[#818CF8]">
                                            <ImageIcon className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                                            Foto Dokumentasi
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800">
                                        {fotoList.length} Foto
                                    </span>
                                </div>
                                <DokList
                                    items={fotoList}
                                    tipe="foto"
                                    teamSlug={teamSlug}
                                    canDelete={canUploadFoto}
                                />
                            </div>

                            {/* Notulen */}
                            <div className="rounded-3xl border border-neutral-200/70 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                                <div className="flex items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                                            <FileText className="size-4" />
                                        </div>
                                        <h2 className="font-display text-base font-bold text-neutral-900 dark:text-neutral-100">
                                            Notulen Acara
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800">
                                        {notulenList.length} Notulen
                                    </span>
                                </div>
                                <DokList
                                    items={notulenList}
                                    tipe="notulen"
                                    teamSlug={teamSlug}
                                    canDelete={canUploadNotulen}
                                />
                            </div>
                        </div>

                        {/* Upload Form */}
                        {canUploadAny && (
                            <UploadForm
                                teamSlug={teamSlug}
                                kegiatanId={selectedKegiatanId!}
                                canUploadFoto={canUploadFoto}
                                canUploadNotulen={canUploadNotulen}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
