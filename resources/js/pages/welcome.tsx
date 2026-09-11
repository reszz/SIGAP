import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BookOpen,
    Calendar,
    Handshake,
    Layers,
    MessageCircleHeart,
    MessageSquare,
    Newspaper,
    Palette,
    Rocket,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import PublicLayout from '@/layouts/public-layout';

// ─── Types (tidak berubah) ─────────────────────────────────────────────────

type ArtikelPreview = {
    id: number;
    judul: string;
    slug: string;
    ringkasan: string;
    gambar_sampul: string | null;
    diterbitkan_pada: string;
    penulis?: { name: string } | null;
};

type PengurusIntiItem = {
    id: number;
    nama: string;
    jabatan: string;
    foto_path: string | null;
    periode: string;
};

type WishTeaser = {
    id: number;
    nama_tampil: string;
    pesan: string;
    waktu_relatif: string;
};

type Props = {
    artikelTerbaru?: ArtikelPreview[];
    pengurusInti?: PengurusIntiItem[];
    wishesTerbaru?: WishTeaser[];
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(d);
}

// palet dilengkapi varian dark supaya latar "soft" tetap kebaca di dark mode
const AVATAR_PALETTE = [
    {
        bg: 'bg-[#4A5FD1]',
        soft: 'bg-[#4A5FD1]/10 dark:bg-[#4A5FD1]/20',
        text: 'text-[#4A5FD1] dark:text-[#8FA0FA]',
    },
    {
        bg: 'bg-[#2E9E82]',
        soft: 'bg-[#2E9E82]/10 dark:bg-[#2E9E82]/20',
        text: 'text-[#2E9E82] dark:text-[#34B394]',
    },
    {
        bg: 'bg-[#B8862E]',
        soft: 'bg-[#B8862E]/10 dark:bg-[#B8862E]/20',
        text: 'text-[#B8862E] dark:text-[#D4A142]',
    },
    {
        bg: 'bg-[#C1546B]',
        soft: 'bg-[#C1546B]/10 dark:bg-[#C1546B]/20',
        text: 'text-[#C1546B] dark:text-[#E08B9C]',
    },
];

function getPalette(id: number) {
    return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

export default function Welcome({
    artikelTerbaru = [],
    pengurusInti = [],
    wishesTerbaru = [],
}: Props) {
    const stats = [
        { icon: Calendar, label: 'Tahun Berdiri', value: '2024' },
        { icon: Users, label: 'Anggota Aktif', value: '20+' },
        { icon: Layers, label: 'Bidang Kepengurusan', value: '6' },
        { icon: Award, label: 'Program Kerja / Tahun', value: '10+' },
    ];

    const bidang = [
        {
            icon: Users,
            palette: AVATAR_PALETTE[0],
            title: 'Kaderisasi & SDM',
            desc: 'Membina jenjang keanggotaan, dari penerimaan anggota baru hingga regenerasi kepengurusan.',
        },
        {
            icon: BookOpen,
            palette: AVATAR_PALETTE[1],
            title: 'Keilmuan & Akademik',
            desc: 'Menjembatani mahasiswa dengan kompetensi keilmuan Teknik Informatika lewat seminar, workshop, dan kompetisi.',
        },
        {
            icon: Palette,
            palette: AVATAR_PALETTE[2],
            title: 'Media, Informasi & Kreatif',
            desc: 'Mengelola publikasi, dokumentasi, dan identitas visual HMIF di seluruh kanal komunikasi.',
        },
        {
            icon: Handshake,
            palette: AVATAR_PALETTE[3],
            title: 'Humas & Kemitraan',
            desc: 'Membangun relasi dengan program studi, alumni, industri, dan organisasi mahasiswa lain.',
        },
        {
            icon: Rocket,
            palette: AVATAR_PALETTE[1],
            title: 'Kewirausahaan',
            desc: 'Mengelola unit usaha himpunan dan membekali anggota dengan wawasan kewirausahaan digital.',
        },
        {
            icon: Trophy,
            palette: AVATAR_PALETTE[0],
            title: 'Olahraga, Seni & Minat Bakat',
            desc: 'Mewadahi minat dan bakat anggota di luar bidang akademik lewat kegiatan olahraga dan seni.',
        },
    ];

    return (
        <PublicLayout
            title="HMIF — Himpunan Mahasiswa Teknik Informatika"
            description="Website resmi Himpunan Mahasiswa Teknik Informatika (HMIF), wadah kreativitas, aspirasi, dan pengembangan diri mahasiswa Teknik Informatika."
        >
            {/* ── 1. Hero ── */}
            <section className="relative overflow-hidden bg-[#FCFCFB] dark:bg-[#12151C]">
                {/* Ambient background blobs — sedikit lebih redup di dark mode */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -left-24 size-[420px] rounded-full bg-[#4A5FD1]/[0.07] blur-3xl dark:bg-[#4A5FD1]/[0.12]" />
                    <div className="absolute -top-10 right-[-10%] size-[380px] rounded-full bg-[#B8862E]/[0.06] blur-3xl dark:bg-[#B8862E]/[0.1]" />
                    <div className="absolute bottom-[-15%] left-1/3 size-[300px] rounded-full bg-[#2E9E82]/[0.05] blur-3xl dark:bg-[#2E9E82]/[0.09]" />
                </div>

                <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4A5FD1]/20 bg-white px-4 py-1.5 text-xs font-semibold text-[#4A5FD1] shadow-sm dark:border-[#4A5FD1]/30 dark:bg-[#181E2B] dark:text-[#8FA0FA]">
                        <Users className="size-3.5" />
                        <span>Himpunan Mahasiswa Teknik Informatika</span>
                    </div>

                    <h1 className="font-display text-4xl leading-[1.1] font-bold tracking-tight text-[#1E2430] sm:text-6xl lg:text-7xl dark:text-[#E6ECF5]">
                        Kolaborasi,
                        <br />
                        <span className="text-[#4A5FD1] dark:text-[#8FA0FA]">
                            Inovasi
                        </span>{' '}
                        & Kontribusi
                    </h1>

                    <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#5B6472] sm:text-lg dark:text-[#8C97A8]">
                        Wadah aspirasi, kreativitas, dan pengembangan diri
                        mahasiswa Teknik Informatika — tempat berorganisasi,
                        berkarya, dan bertumbuh bersama di luar ruang kelas.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <Link
                            href="/profil/visi-misi"
                            className="group flex items-center gap-2 rounded-full bg-[#4A5FD1] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#4A5FD1]/25 transition hover:bg-[#3B4DB8] hover:shadow-xl hover:shadow-[#4A5FD1]/30"
                        >
                            <span>Tentang HMIF</span>
                            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href="/kalender"
                            className="flex items-center gap-2 rounded-full border border-[rgba(30,36,48,0.14)] bg-white px-7 py-3.5 text-sm font-semibold text-[#1E2430] shadow-sm transition hover:border-[#4A5FD1]/30 hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.14)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:bg-[#0E121A]"
                        >
                            <Calendar className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <span>Lihat Kalender Kegiatan</span>
                        </Link>
                    </div>
                </div>

                {/* Stat strip */}
                <div className="relative border-t border-[rgba(30,36,48,0.06)] bg-white/70 backdrop-blur-sm dark:border-[rgba(255,255,255,0.06)] dark:bg-[#181E2B]/60">
                    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4 sm:px-6 lg:px-8">
                        {stats.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div
                                    key={i}
                                    className="flex flex-col items-center text-center"
                                >
                                    <span className="font-display text-3xl font-bold text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                                        {s.value}
                                    </span>
                                    <span className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-[#5B6472] uppercase dark:text-[#8C97A8]">
                                        <Icon className="size-3 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── 2. Tentang Kami ── */}
            <section className="bg-white py-16 sm:py-20 dark:bg-[#181E2B]/50">
                <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-5 lg:gap-16 lg:px-8">
                    <div className="lg:col-span-2">
                        <span className="text-xs font-bold tracking-wider text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                            Profil Himpunan
                        </span>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                            Mengenal HMIF
                        </h2>
                        <div className="mt-4 h-1 w-14 rounded-full bg-[#4A5FD1] dark:bg-[#8FA0FA]" />
                    </div>
                    <div className="lg:col-span-3">
                        <p className="text-sm leading-relaxed text-[#5B6472] sm:text-base dark:text-[#8C97A8]">
                            HMIF merupakan organisasi mahasiswa di tingkat
                            program studi yang menjadi wadah perjuangan aspirasi
                            serta penumbuhan dan peningkatan potensi mahasiswa
                            Teknik Informatika. Melalui berbagai program kerja
                            di bidang akademik, kreativitas, dan sosial, HMIF
                            berupaya membentuk mahasiswa yang unggul secara
                            keilmuan sekaligus aktif berorganisasi.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                            <Link
                                href="/profil/visi-misi"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A5FD1] transition hover:underline dark:text-[#8FA0FA]"
                            >
                                <span>Lihat Visi & Misi</span>
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                href="/profil/sejarah"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A5FD1] transition hover:underline dark:text-[#8FA0FA]"
                            >
                                <span>Sejarah Organisasi</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3. Bidang Kepengurusan ── */}
            <section className="bg-[#F8F9FB] py-16 sm:py-20 dark:bg-[#0E121A]/40">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <span className="text-xs font-bold tracking-wider text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                            Divisi Kerja
                        </span>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                            Bidang Kepengurusan
                        </h2>
                        <p className="mt-2 text-sm text-[#5B6472] dark:text-[#8C97A8]">
                            Enam bidang yang menggerakkan roda kegiatan dan
                            pelayanan HMIF
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {bidang.map((b, i) => {
                            const Icon = b.icon;
                            return (
                                <div
                                    key={i}
                                    className="group rounded-2xl border border-[rgba(30,36,48,0.06)] bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-[rgba(255,255,255,0.06)] dark:bg-[#181E2B] dark:hover:bg-[#21293A]/70"
                                >
                                    <div
                                        className={`mb-5 flex size-12 items-center justify-center rounded-xl ${b.palette.bg} shadow-sm`}
                                    >
                                        <Icon className="size-6 text-white" />
                                    </div>
                                    <h3 className="font-display text-base font-bold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {b.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-[#5B6472] dark:text-[#8C97A8]">
                                        {b.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 flex justify-center">
                        <Link
                            href="/keorganisasian/divisi"
                            className="inline-flex items-center gap-2 rounded-full border border-[rgba(30,36,48,0.12)] bg-white px-5 py-2.5 text-sm font-semibold text-[#1E2430] shadow-sm transition hover:border-[#4A5FD1]/30 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:hover:border-[#4A5FD1]/40"
                        >
                            <span>Detail Divisi & Bidang</span>
                            <ArrowRight className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── 4. Pengurus Inti ── */}
            {pengurusInti.length > 0 && (
                <section className="bg-white py-16 sm:py-20 dark:bg-[#181E2B]/50">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <span className="text-xs font-bold tracking-wider text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                                    Kepemimpinan
                                </span>
                                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                                    Pengurus Inti
                                </h2>
                                <p className="mt-2 text-sm text-[#5B6472] dark:text-[#8C97A8]">
                                    Pucuk pimpinan penggerak organisasi periode{' '}
                                    {pengurusInti[0]?.periode}
                                </p>
                            </div>
                            <Link
                                href="/keorganisasian/struktur"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                            >
                                <span>Lihat Struktur Lengkap</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {pengurusInti.map((p) => {
                                const palette = getPalette(p.id);
                                const initials = p.nama
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((w) => w[0])
                                    .join('')
                                    .toUpperCase();

                                return (
                                    <div
                                        key={p.id}
                                        className="flex flex-col items-center rounded-2xl border border-[rgba(30,36,48,0.06)] bg-white p-6 text-center shadow-sm transition hover:shadow-md dark:border-[rgba(255,255,255,0.06)] dark:bg-[#181E2B] dark:hover:bg-[#21293A]/70"
                                    >
                                        {p.foto_path ? (
                                            <img
                                                src={`/storage/${p.foto_path}`}
                                                alt={p.nama}
                                                className="size-20 rounded-full object-cover ring-4 ring-[#F8F9FB] dark:ring-[#0E121A]"
                                            />
                                        ) : (
                                            <div
                                                className={`flex size-20 items-center justify-center rounded-full ${palette.soft} font-display text-lg font-bold ${palette.text} ring-4 ring-[#F8F9FB] dark:ring-[#0E121A]`}
                                            >
                                                {initials}
                                            </div>
                                        )}
                                        <p className="mt-4 font-display text-sm font-bold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {p.nama}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-[#5B6472] dark:text-[#8C97A8]">
                                            {p.jabatan}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 5. Artikel & Berita Terbaru ── */}
            {artikelTerbaru.length > 0 && (
                <section className="bg-[#F8F9FB] py-16 sm:py-20 dark:bg-[#0E121A]/40">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-12 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                            <div>
                                <span className="text-xs font-bold tracking-wider text-[#4A5FD1] uppercase dark:text-[#8FA0FA]">
                                    Publikasi & Kabar
                                </span>
                                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                                    Artikel & Berita Terbaru
                                </h2>
                            </div>
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                            >
                                <span>Lihat Semua Artikel</span>
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {artikelTerbaru.map((artikel) => (
                                <Link
                                    key={artikel.id}
                                    href={`/blog/${artikel.slug}`}
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-[rgba(30,36,48,0.06)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-[rgba(255,255,255,0.06)] dark:bg-[#181E2B] dark:hover:bg-[#21293A]/70"
                                >
                                    <div className="relative aspect-video w-full overflow-hidden bg-[#EEF0F4] dark:bg-[#0E121A]">
                                        {artikel.gambar_sampul ? (
                                            <img
                                                src={`/storage/${artikel.gambar_sampul}`}
                                                alt={artikel.judul}
                                                className="size-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-[#B8BFCC] dark:text-[#3E4759]">
                                                <Newspaper className="size-10 stroke-1" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="font-mono-sigap mb-3 flex items-center gap-1.5 text-[11px] font-medium text-[#8992A0] dark:text-[#727C8E]">
                                            <Calendar className="size-3" />
                                            <span>
                                                {formatDate(
                                                    artikel.diterbitkan_pada,
                                                )}
                                            </span>
                                        </div>

                                        <h3 className="line-clamp-2 font-display text-base font-bold text-[#1E2430] transition group-hover:text-[#4A5FD1] dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA]">
                                            {artikel.judul}
                                        </h3>

                                        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[#5B6472] dark:text-[#8C97A8]">
                                            {artikel.ringkasan}
                                        </p>

                                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#4A5FD1] dark:text-[#8FA0FA]">
                                            <span>Baca Selengkapnya</span>
                                            <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 6. Wish Wall ── */}
            <section className="bg-white py-16 sm:py-20 dark:bg-[#181E2B]/50">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#B8862E] uppercase dark:text-[#D4A142]">
                                <Sparkles className="size-4" />
                                <span>Ruang Aspirasi & Semangat</span>
                            </div>
                            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl dark:text-[#E6ECF5]">
                                Wish Wall Komunitas
                            </h2>
                            <p className="mt-2 text-sm text-[#5B6472] dark:text-[#8C97A8]">
                                Harapan, apresiasi, dan pesan terbuka untuk HMIF
                            </p>
                        </div>
                        <Link
                            href="/wish-wall"
                            className="inline-flex items-center gap-2 rounded-full bg-[#4A5FD1] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#4A5FD1]/20 transition hover:bg-[#3B4DB8]"
                        >
                            <span>Tulis Pesan & Lihat Semua</span>
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>

                    {wishesTerbaru.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(30,36,48,0.14)] bg-[#F8F9FB] py-16 text-center dark:border-[rgba(255,255,255,0.14)] dark:bg-[#0E121A]/40">
                            <MessageSquare className="size-9 text-[#B8BFCC] dark:text-[#3E4759]" />
                            <p className="mt-3 text-sm font-medium text-[#5B6472] dark:text-[#8C97A8]">
                                Belum ada pesan di Wish Wall.
                            </p>
                            <Link
                                href="/wish-wall"
                                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#4A5FD1] hover:underline dark:text-[#8FA0FA]"
                            >
                                Jadilah yang pertama menulis pesan →
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {wishesTerbaru.map((wish) => {
                                const palette = getPalette(wish.id);
                                return (
                                    <div
                                        key={wish.id}
                                        className="overflow-hidden rounded-2xl border border-[rgba(30,36,48,0.06)] bg-white shadow-sm transition hover:shadow-md dark:border-[rgba(255,255,255,0.06)] dark:bg-[#181E2B] dark:hover:bg-[#21293A]/70"
                                    >
                                        <div
                                            className={`h-1.5 w-full ${palette.bg}`}
                                        />
                                        <div className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${palette.soft} text-xs font-bold ${palette.text}`}
                                                >
                                                    {wish.nama_tampil
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate font-display text-sm font-bold text-[#1E2430] dark:text-[#E6ECF5]">
                                                        {wish.nama_tampil}
                                                    </h3>
                                                    <p className="font-mono-sigap text-[11px] text-[#8992A0] dark:text-[#727C8E]">
                                                        {wish.waktu_relatif}
                                                    </p>
                                                </div>
                                                <MessageCircleHeart
                                                    className={`ml-auto size-4 ${palette.text} opacity-60`}
                                                />
                                            </div>

                                            <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-[#374050] dark:text-[#C7CEDB]">
                                                "{wish.pesan}"
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </PublicLayout>
    );
}
