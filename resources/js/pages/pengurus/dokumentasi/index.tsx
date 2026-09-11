import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, Download, FileText, ImageIcon, Trash2, Upload } from 'lucide-react';

import { useRef, useState } from 'react';
import {kegiatanBreadcrumbs} from '@/lib/breadcrumbs';
import { index as dokumentasiIndex, store, destroy, download as dokumentasiDownload } from '@/routes/dokumentasi';
import { confirmDelete, Toast } from '@/lib/sweetalert';
import { index as panitiaIndex } from '@/routes/panitia';
import ReadOnlyBanner from '@/components/read-only-banner';
import AccessRestrictionCard from '@/components/access-restriction-card';


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
    isReadOnly?: boolean;
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
            className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 shadow-xs sm:p-5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]"
        >
            <h3 className="mb-3 font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                Upload Berkas Baru
            </h3>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                {/* Tipe radio */}
                <div className="w-full sm:w-auto">
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Tipe Dokumen <span className="text-[#C4514A]">*</span>
                    </p>
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        {canUploadFoto && (
                            <label className="flex cursor-pointer items-center gap-2">
                                <input
                                    type="radio"
                                    name="tipe"
                                    value="foto"
                                    checked={tipe === 'foto'}
                                    onChange={() => {
                                        setTipe('foto');
                                        setFile(null);
                                        if (inputRef.current)
                                            inputRef.current.value = '';
                                    }}
                                    className="text-[#4A5FD1] focus:ring-[#4A5FD1]"
                                />
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    <ImageIcon className="size-3.5 text-[#4A5FD1]" />{' '}
                                    Foto
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
                                    onChange={() => {
                                        setTipe('notulen');
                                        setFile(null);
                                        if (inputRef.current)
                                            inputRef.current.value = '';
                                    }}
                                    className="text-[#4A5FD1] focus:ring-[#4A5FD1]"
                                />
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                    <FileText className="size-3.5 text-[#4A5FD1]" />{' '}
                                    Notulen
                                </span>
                            </label>
                        )}
                    </div>
                </div>

                {/* File input */}
                <div className="w-full min-w-0 flex-1">
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-[#727C8E] uppercase dark:text-[#8C97A8]">
                        Pilih File <span className="text-[#C4514A]">*</span>
                        {tipe === 'foto' && (
                            <span className="ml-1 font-normal text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                                (JPG/PNG, max 10 MB)
                            </span>
                        )}
                        {tipe === 'notulen' && (
                            <span className="ml-1 font-normal text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                                (PDF/DOC/DOCX, max 20 MB)
                            </span>
                        )}
                    </p>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={acceptAttr}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        className="w-full min-w-0 text-[11px] text-[#727C8E] file:mr-2 file:rounded-md file:border-0 file:bg-[#4A5FD1]/10 file:px-2.5 file:py-1.5 file:text-[11px] file:font-semibold file:text-[#4A5FD1] hover:file:bg-[#4A5FD1]/20 dark:text-[#8C97A8] dark:file:bg-[#4A5FD1]/20 dark:file:text-[#8FA0FA]"
                    />
                    {error && (
                        <p className="mt-1 text-xs text-[#C4514A]">{error}</p>
                    )}
                </div>

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={uploading}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50 sm:w-auto sm:py-2"
                >
                    <Upload className="size-4" />
                    <span>{uploading ? 'Mengunggah...' : 'Unggah Berkas'}</span>
                </button>
            </div>
        </form>
    );
}

// ─── Dokumentasi List ─────────────────────────────────────────────────────────

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
        const item = items.find((i) => i.id === id);
        const label = item ? `"${item.filename}"` : 'berkas ini';
        const confirmed = await confirmDelete('Berkas', `Hapus ${label}?`);
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
            <p className="mt-4 text-xs italic text-[#727C8E]/70 dark:text-[#8C97A8]/70">
                Belum ada berkas {tipe === 'foto' ? 'foto' : 'notulen'}.
            </p>
        );
    }

    return (
        <div className="mt-3 flex flex-col gap-2.5">
            {items.map((d) => (
                <div
                    key={d.id}
                    className="group flex flex-col justify-between gap-3 rounded-lg border border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/50 p-3 text-xs transition hover:border-[#4A5FD1]/40 sm:flex-row sm:items-center dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/40"
                >
                    <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                            {tipe === 'foto' ? (
                                <ImageIcon className="size-4" />
                            ) : (
                                <FileText className="size-4" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="w-full font-semibold break-all text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                {d.filename}
                            </p>
                            <p className="font-mono-sigap mt-0.5 text-[10px] text-[#727C8E] dark:text-[#8C97A8]">
                                <span className="break-words">
                                    Oleh: {d.uploaded_by} • {d.created_at}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex w-full shrink-0 items-center justify-end gap-2 self-end border-t border-[rgba(30,36,48,0.06)] pt-2 sm:w-auto sm:self-auto sm:border-t-0 sm:pt-0 dark:border-[rgba(255,255,255,0.06)]">
                        <a
                            href={dokumentasiDownload.url({
                                current_team: teamSlug,
                                dokumentasi: d.id,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(30,36,48,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                        >
                            <Download className="size-3 text-[#4A5FD1]" />
                            <span>Unduh</span>
                        </a>
                        {canDelete && (
                            <button
                                onClick={() => hapus(d.id)}
                                title="Hapus berkas"
                                className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-[#C4514A]/10 hover:text-[#C4514A]"
                            >
                                <Trash2 className="size-4 sm:size-3.5" />
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
    isReadOnly,
}: Props) {
    const { url } = usePage();
    const teamSlug = url.split('/')[1];

    const selectedKegiatan = kegiatanList.find((k) => k.id === selectedKegiatanId) ?? null;
    const canUploadAny = !isReadOnly && (canUploadFoto || canUploadNotulen);

    const fotoList = dokumentasi.filter((d) => d.tipe === 'foto');
    const notulenList = dokumentasi.filter((d) => d.tipe === 'notulen');

    function pilihKegiatan(id: number) {
        router.get(dokumentasiIndex.url(teamSlug), { kegiatan_id: id }, { preserveState: false });
    }

    return (
        <>
            <Head title="Dokumentasi & Berkas" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {isReadOnly && (
                    <ReadOnlyBanner
                        roleName="Pembina"
                        message="Anda sedang dalam mode pemantauan dokumentasi. Anda dapat melihat dan mengunduh berkas dokumentasi serta notulen tanpa izin mengunggah atau menghapus."
                    />
                )}

                {/* ─── Header ─── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                            Dokumentasi & Berkas
                        </h1>
                        <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Arsip foto kegiatan dan notulen pertanggungjawaban
                        </p>
                    </div>

                    {kegiatanList.length > 0 && (
                        <div className="relative w-full min-w-0 sm:w-64">
                            <select
                                value={selectedKegiatanId ?? ''}
                                onChange={(e) =>
                                    pilihKegiatan(Number(e.target.value))
                                }
                                className="w-full appearance-none truncate rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2 pr-10 pl-3.5 text-xs font-semibold text-[#1E2430] outline-none focus:border-[#4A5FD1] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
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
                            <ChevronDown className="pointer-events-none absolute top-2.5 right-3 size-4 text-[#727C8E]" />
                        </div>
                    )}
                </div>

                {/* ─── Belum pilih kegiatan ─── */}
                {kegiatanList.length === 0 ? (
                    <AccessRestrictionCard actionType="dokumentasi" />
                ) : !selectedKegiatan ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B]">
                        <FileText className="mb-3 size-10 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <p className="text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                            Pilih kegiatan di atas untuk melihat dokumentasi & notulen.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Grid Foto + Notulen */}
                        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                            {/* Foto */}
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 shadow-xs sm:p-5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <ImageIcon className="size-4" />
                                        </div>
                                        <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Foto Dokumentasi
                                        </h2>
                                    </div>
                                    <span className="font-mono-sigap rounded-md bg-[#4A5FD1]/12 px-2 py-0.5 text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
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
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 shadow-xs sm:p-5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <FileText className="size-4" />
                                        </div>
                                        <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            Notulen Acara
                                        </h2>
                                    </div>
                                    <span className="font-mono-sigap rounded-md bg-[#4A5FD1]/12 px-2 py-0.5 text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
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

DokumentasiIndex.layout = (
    page: Props & {
        currentTeam?: { slug: string } | null;
    },
) => {
    const teamSlug = page.currentTeam?.slug ?? '';
    const selectedKegiatan = page.kegiatanList.find(
        (k) => k.id === page.selectedKegiatanId,
    );

    return {
        breadcrumbs: kegiatanBreadcrumbs(
            'Kegiatan',
            teamSlug ? dokumentasiIndex.url(teamSlug) : '/kegiatan',
            {
                title: 'Dokumentasi & Berkas',
                href: teamSlug ? panitiaIndex.url(teamSlug) : '/dokumentasi',
            },
            selectedKegiatan && { title: selectedKegiatan.nama, href: '' },
        ),
    };
};
