import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bold,
    Calendar,
    Check,
    Code,
    Eye,
    Heading1,
    Heading2,
    Image as ImageIcon,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    PenLine,
    Quote,
    Sparkles,
    Trash2,
    Upload,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { renderMarkdownToHtml } from '@/lib/markdown';

// ─── Types ────────────────────────────────────────────────────────────────────

type Artikel = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string;
    konten: string;
    gambar_sampul: string | null;
    status: 'draft' | 'terbit';
    diterbitkan_pada: string | null;
};

type Props = {
    artikel: Artikel | null;
};

// ─── Main Form Page ───────────────────────────────────────────────────────────

export default function ArtikelForm({ artikel }: Props) {
    const { currentTeam } = usePage().props as any;
    const teamSlug = currentTeam?.slug ?? '';
    const isEditing = !!artikel;

    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
    const [imagePreview, setImagePreview] = useState<string | null>(
        artikel?.gambar_sampul ? `/storage/${artikel.gambar_sampul}` : null,
    );
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial form state
    const { data, setData, post, processing, errors, transform } = useForm({
        _method: isEditing ? 'PATCH' : 'POST',
        judul: artikel?.judul ?? '',
        ringkasan: artikel?.ringkasan ?? '',
        konten: artikel?.konten ?? '',
        status: artikel?.status ?? 'draft',
        diterbitkan_pada: artikel?.diterbitkan_pada
            ? new Date(artikel.diterbitkan_pada).toISOString().slice(0, 16)
            : '',
        gambar_sampul: null as File | null,
    });

    // Handle image file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('gambar_sampul', file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('gambar_sampul', null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Helper for inserting Markdown formatting into textarea
    const insertFormatting = (before: string, after: string = '', defaultText: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = data.konten.substring(start, end) || defaultText;

        const replacement = `${before}${selectedText}${after}`;
        const newKonten =
            data.konten.substring(0, start) + replacement + data.konten.substring(end);

        setData('konten', newKonten);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selectedText.length,
            );
        }, 10);
    };

    // Submit handler
    const handleSubmit = (targetStatus?: 'draft' | 'terbit') => {
        const submissionStatus = targetStatus || data.status;
        setData('status', submissionStatus);

        const url = isEditing
            ? `/${teamSlug}/pengurus/artikel/${artikel.id}`
            : `/${teamSlug}/pengurus/artikel`;

        post(url, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head
                title={`${isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'} - SIGAP`}
            />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {/* ── Top Header with Back Button ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/${teamSlug}/pengurus/artikel`}
                            className="flex size-9 items-center justify-center rounded-lg border border-[rgba(30,36,48,0.12)] bg-white text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                                {isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                            </h1>
                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {isEditing
                                    ? `Memperbarui konten artikel "${artikel.judul}"`
                                    : 'Susun artikel atau liputan kegiatan untuk dipublikasikan'}
                            </p>
                        </div>
                    </div>

                    {/* Quick action buttons in header */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleSubmit('draft')}
                            className="rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-4 py-2 text-xs font-semibold text-[#1E2430] transition hover:bg-[#F6F7F9] disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#21293A]"
                        >
                            Simpan Draft
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleSubmit('terbit')}
                            className="flex items-center gap-1.5 rounded-lg bg-[#4A5FD1] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3B4DB8] disabled:opacity-50"
                        >
                            <Check className="size-3.5" />
                            <span>{isEditing ? 'Simpan & Terbitkan' : 'Terbitkan Sekarang'}</span>
                        </button>
                    </div>
                </div>

                {/* ── Main Form Grid ── */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                >
                    {/* ── Left / Main Content Column (2 cols) ── */}
                    <div className="flex flex-col gap-6 lg:col-span-2">
                        {/* Card: Judul & Ringkasan */}
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="judul"
                                        className="block text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]"
                                    >
                                        Judul Artikel <span className="text-[#C4514A]">*</span>
                                    </label>
                                    <input
                                        id="judul"
                                        type="text"
                                        value={data.judul}
                                        onChange={(e) => setData('judul', e.target.value)}
                                        placeholder="Misal: Pelantikan Pengurus Baru HMIF Periode 2026/2027"
                                        className="mt-1.5 w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#1E2430] placeholder-[#727C8E]/60 focus:border-[#4A5FD1] focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A] dark:text-[#E6ECF5]"
                                    />
                                    {errors.judul && (
                                        <p className="mt-1 text-xs text-[#C4514A]">
                                            {errors.judul}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="ringkasan"
                                        className="block text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]"
                                    >
                                        Ringkasan / Sinopsis Singkat{' '}
                                        <span className="text-[#C4514A]">*</span>
                                    </label>
                                    <textarea
                                        id="ringkasan"
                                        rows={2}
                                        value={data.ringkasan}
                                        onChange={(e) => setData('ringkasan', e.target.value)}
                                        placeholder="Ringkasan 1-2 kalimat untuk preview di kartu artikel dan meta deskripsi..."
                                        className="mt-1.5 w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white px-3.5 py-2 text-xs leading-relaxed text-[#1E2430] placeholder-[#727C8E]/60 focus:border-[#4A5FD1] focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A] dark:text-[#E6ECF5]"
                                    />
                                    {errors.ringkasan && (
                                        <p className="mt-1 text-xs text-[#C4514A]">
                                            {errors.ringkasan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Card: Markdown Content Editor */}
                        <div className="flex flex-col rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            {/* Toolbar & Tab Switcher */}
                            <div className="flex flex-wrap items-center justify-between border-b border-[rgba(30,36,48,0.08)] bg-[#F6F7F9]/70 p-2.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#21293A]/50">
                                {/* Format actions */}
                                <div className="flex flex-wrap items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('**', '**', 'teks tebal')}
                                        title="Tebal (Bold)"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Bold className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('*', '*', 'teks miring')}
                                        title="Miring (Italic)"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Italic className="size-3.5" />
                                    </button>
                                    <div className="mx-1 h-4 w-px bg-[rgba(30,36,48,0.12)] dark:bg-[rgba(255,255,255,0.12)]" />
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('## ', '', 'Subjudul')}
                                        title="Heading 2"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Heading1 className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('### ', '', 'Sub-subjudul')}
                                        title="Heading 3"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Heading2 className="size-3.5" />
                                    </button>
                                    <div className="mx-1 h-4 w-px bg-[rgba(30,36,48,0.12)] dark:bg-[rgba(255,255,255,0.12)]" />
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('> ', '', 'Kutipan')}
                                        title="Kutipan (Quote)"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Quote className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('- ', '', 'Poin daftar')}
                                        title="Daftar Poin (Bullet List)"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <List className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('1. ', '', 'Langkah')}
                                        title="Daftar Nomor (Numbered List)"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <ListOrdered className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => insertFormatting('`', '`', 'kode')}
                                        title="Inline Code"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <Code className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            insertFormatting(
                                                '[Teks Tautan](https://example.com)',
                                                '',
                                                '',
                                            )
                                        }
                                        title="Sisipkan Link"
                                        className="rounded-md p-1.5 text-[#727C8E] transition hover:bg-white hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#181E2B] dark:hover:text-[#E6ECF5]"
                                    >
                                        <LinkIcon className="size-3.5" />
                                    </button>
                                </div>

                                {/* Write vs Preview Tab */}
                                <div className="flex items-center gap-1 rounded-md border border-[rgba(30,36,48,0.08)] bg-white p-0.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('write')}
                                        className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition ${
                                            activeTab === 'write'
                                                ? 'bg-[#4A5FD1] text-white'
                                                : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                        }`}
                                    >
                                        <PenLine className="size-3" />
                                        <span>Tulis</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('preview')}
                                        className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold transition ${
                                            activeTab === 'preview'
                                                ? 'bg-[#4A5FD1] text-white'
                                                : 'text-[#727C8E] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:text-[#E6ECF5]'
                                        }`}
                                    >
                                        <Eye className="size-3" />
                                        <span>Pratinjau</span>
                                    </button>
                                </div>
                            </div>

                            {/* Content Body */}
                            {activeTab === 'write' ? (
                                <div className="p-4">
                                    <textarea
                                        ref={textareaRef}
                                        rows={18}
                                        value={data.konten}
                                        onChange={(e) => setData('konten', e.target.value)}
                                        placeholder="Tuliskan isi lengkap artikel di sini. Gunakan tombol di atas untuk format heading, tebal, daftar poin, atau kutipan..."
                                        className="w-full resize-y rounded-md border-0 bg-transparent font-sans text-sm leading-relaxed text-[#1E2430] placeholder-[#727C8E]/50 focus:outline-none dark:text-[#E6ECF5]"
                                    />
                                </div>
                            ) : (
                                <div className="min-h-[380px] p-6">
                                    {data.konten.trim() ? (
                                        <div
                                            className="prose max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{
                                                __html: renderMarkdownToHtml(data.konten),
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-64 flex-col items-center justify-center text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                            <Sparkles className="mb-2 size-6 text-[#A8B0BE] dark:text-[#5A6070]" />
                                            <span>Belum ada konten untuk dipratinjau.</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.konten && (
                                <div className="border-t border-[rgba(30,36,48,0.08)] px-4 py-2 dark:border-[rgba(255,255,255,0.08)]">
                                    <p className="text-xs text-[#C4514A]">
                                        {errors.konten}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right / Settings Column (1 col) ── */}
                    <div className="flex flex-col gap-6">
                        {/* Card: Gambar Sampul */}
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <h3 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Gambar Sampul (Cover)
                            </h3>
                            <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                Format JPG, PNG, atau WebP (Maks. 2MB)
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {imagePreview ? (
                                <div className="relative mt-3 overflow-hidden rounded-lg border border-[rgba(30,36,48,0.12)] dark:border-[rgba(255,255,255,0.12)]">
                                    <img
                                        src={imagePreview}
                                        alt="Pratinjau Sampul"
                                        className="aspect-video w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 text-xs text-white backdrop-blur-xs">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="hover:underline"
                                        >
                                            Ganti Gambar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveImage}
                                            className="flex items-center gap-1 text-[#C4514A] hover:underline"
                                        >
                                            <Trash2 className="size-3" />
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-3 flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[rgba(30,36,48,0.15)] bg-[#F6F7F9]/60 p-4 transition hover:border-[#4A5FD1] hover:bg-white dark:border-[rgba(255,255,255,0.15)] dark:bg-[#21293A]/50 dark:hover:bg-[#181E2B]"
                                >
                                    <Upload className="size-6 text-[#727C8E] dark:text-[#8C97A8]" />
                                    <span className="mt-2 text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        Pilih Gambar Sampul
                                    </span>
                                    <span className="text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        Klik untuk menelusuri berkas
                                    </span>
                                </button>
                            )}

                            {errors.gambar_sampul && (
                                <p className="mt-2 text-xs text-[#C4514A]">
                                    {errors.gambar_sampul}
                                </p>
                            )}
                        </div>

                        {/* Card: Status & Publikasi */}
                        <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-5 shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                            <h3 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                Pengaturan Publikasi
                            </h3>

                            {/* Status Selector */}
                            <div className="mt-3 space-y-2">
                                <label className="block text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]">
                                    Status Artikel
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'draft')}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition ${
                                            data.status === 'draft'
                                                ? 'border-[#727C8E] bg-[#727C8E]/10 text-[#1E2430] dark:text-[#E6ECF5]'
                                                : 'border-[rgba(30,36,48,0.10)] text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.10)] dark:text-[#8C97A8] dark:hover:bg-[#21293A]'
                                        }`}
                                    >
                                        <span className="size-1.5 rounded-full bg-[#727C8E]" />
                                        <span>Draft</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('status', 'terbit')}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition ${
                                            data.status === 'terbit'
                                                ? 'border-[#2E9E82] bg-[#2E9E82]/10 text-[#2E9E82] dark:text-[#34B394]'
                                                : 'border-[rgba(30,36,48,0.10)] text-[#727C8E] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.10)] dark:text-[#8C97A8] dark:hover:bg-[#21293A]'
                                        }`}
                                    >
                                        <span className="size-1.5 rounded-full bg-[#2E9E82]" />
                                        <span>Terbit</span>
                                    </button>
                                </div>
                                {errors.status && (
                                    <p className="mt-1 text-xs text-[#C4514A]">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            {/* Jadwal Terbit Input */}
                            <div className="mt-4">
                                <label
                                    htmlFor="diterbitkan_pada"
                                    className="block text-xs font-medium text-[#727C8E] dark:text-[#8C97A8]"
                                >
                                    Waktu Publikasi (Opsional)
                                </label>
                                <div className="relative mt-1.5 flex items-center">
                                    <Calendar className="absolute left-3 size-3.5 text-[#727C8E] dark:text-[#8C97A8]" />
                                    <input
                                        id="diterbitkan_pada"
                                        type="datetime-local"
                                        value={data.diterbitkan_pada}
                                        onChange={(e) =>
                                            setData('diterbitkan_pada', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2 pr-3 pl-8 text-xs text-[#1E2430] focus:border-[#4A5FD1] focus:outline-none dark:border-[rgba(255,255,255,0.12)] dark:bg-[#21293A] dark:text-[#E6ECF5]"
                                    />
                                </div>
                                <p className="mt-1 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    Kosongkan untuk menggunakan waktu saat ini saat diterbitkan.
                                </p>
                                {errors.diterbitkan_pada && (
                                    <p className="mt-1 text-xs text-[#C4514A]">
                                        {errors.diterbitkan_pada}
                                    </p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-6 flex flex-col gap-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#4A5FD1] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#3B4DB8] disabled:opacity-50"
                                >
                                    <Check className="size-3.5" />
                                    <span>
                                        {isEditing
                                            ? 'Simpan Perubahan'
                                            : data.status === 'terbit'
                                              ? 'Terbitkan Artikel'
                                              : 'Simpan Sebagai Draft'}
                                    </span>
                                </button>

                                <Link
                                    href={`/${teamSlug}/pengurus/artikel`}
                                    className="flex w-full items-center justify-center rounded-lg border border-[rgba(30,36,48,0.12)] bg-white py-2.5 text-xs font-semibold text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#8C97A8] dark:hover:bg-[#21293A] dark:hover:text-[#E6ECF5]"
                                >
                                    Batal
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
