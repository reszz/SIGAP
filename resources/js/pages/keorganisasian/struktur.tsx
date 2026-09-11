import PublicLayout from '@/layouts/public-layout';
import { Users, ChevronDown, User, Layers, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface PengurusItem {
    id: number;
    nama: string;
    jabatan: string;
    divisi_organisasi_id: number | null;
    periode: string;
    urutan_tampil: number;
    foto_path: string | null;
}

interface DivisiItem {
    id: number;
    nama_divisi: string;
    deskripsi: string | null;
    urutan_tampil: number;
    pengurus: PengurusItem[];
}

interface Props {
    periodeList: string[];
    selectedPeriode: string;
    pengurusInti: PengurusItem[];
    divisiList: DivisiItem[];
}

function AvatarMember({
    nama,
    foto_path,
    size = 'normal',
}: {
    nama: string;
    foto_path: string | null;
    size?: 'normal' | 'large';
}) {
    const initials = nama
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    const sizeClasses =
        size === 'large'
            ? 'size-16 sm:size-20 text-base sm:text-lg'
            : 'size-12 sm:size-14 text-xs sm:text-sm';

    if (foto_path) {
        return (
            <img
                src={`/storage/${foto_path}`}
                alt={nama}
                className={`${sizeClasses} shrink-0 rounded-full object-cover ring-2 ring-[#4A5FD1]/30 shadow-xs dark:ring-[#4A5FD1]/40`}
            />
        );
    }

    return (
        <div
            className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4A5FD1]/20 to-[#4A5FD1]/5 font-display font-bold text-[#4A5FD1] ring-2 ring-[#4A5FD1]/30 shadow-xs dark:from-[#4A5FD1]/30 dark:to-[#4A5FD1]/10 dark:text-[#8FA0FA] dark:ring-[#4A5FD1]/40`}
        >
            {initials}
        </div>
    );
}

// ─── Pucuk Pimpinan / Pengurus Inti Card ───────────────────────────────────────

function IntiCard({ p }: { p: PengurusItem }) {
    return (
        <div className="group relative flex flex-col items-center rounded-2xl border border-[rgba(30,36,48,0.08)] bg-white p-5 sm:p-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#4A5FD1]/40 hover:shadow-md dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:hover:border-[#4A5FD1]/50">
            {/* Top decorative accent glow */}
            <div className="absolute inset-x-6 top-0 h-1 rounded-b-full bg-gradient-to-r from-transparent via-[#4A5FD1] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <AvatarMember nama={p.nama} foto_path={p.foto_path} size="large" />

            <div className="mt-4 w-full">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#4A5FD1]/10 px-3 py-1 font-mono-sigap text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                    <ShieldCheck className="size-3" />
                    {p.jabatan}
                </span>

                <h3 className="mt-2.5 font-display text-base font-semibold text-[#1E2430] transition group-hover:text-[#4A5FD1] sm:text-lg dark:text-[#E6ECF5] dark:group-hover:text-[#8FA0FA] break-words">
                    {p.nama}
                </h3>
            </div>
        </div>
    );
}

// ─── Divisi Member Card ───────────────────────────────────────────────────────

function MemberCard({ p }: { p: PengurusItem }) {
    return (
        <div className="group flex items-center gap-3.5 rounded-xl border border-[rgba(30,36,48,0.08)] bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:border-[#2E9E82]/40 hover:shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B] dark:hover:border-[#2E9E82]/50">
            <AvatarMember nama={p.nama} foto_path={p.foto_path} size="normal" />

            <div className="min-w-0 flex-1">
                <h4 className="font-display text-sm font-semibold text-[#1E2430] transition group-hover:text-[#2E9E82] dark:text-[#E6ECF5] dark:group-hover:text-[#34B394] break-words">
                    {p.nama}
                </h4>
                <p className="mt-0.5 text-xs font-medium text-[#727C8E] dark:text-[#8C97A8] break-words">
                    {p.jabatan}
                </p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StrukturPage({
    periodeList,
    selectedPeriode,
    pengurusInti,
    divisiList,
}: Props) {
    const [periode, setPeriode] = useState(selectedPeriode);

    function changePeriode(val: string) {
        setPeriode(val);
        router.get(
            '/keorganisasian/struktur',
            { periode: val },
            { preserveScroll: true, replace: true },
        );
    }

    const isEmpty =
        pengurusInti.length === 0 &&
        divisiList.every((d) => d.pengurus.length === 0);

    const totalPengurus =
        pengurusInti.length +
        divisiList.reduce((acc, d) => acc + d.pengurus.length, 0);

    return (
        <PublicLayout
            title="Struktur Kepengurusan — SIGAP"
            description="Susunan bagan hierarki dan profil pengurus organisasi untuk periode kepengurusan aktif."
        >
            {/* ── Hero Header ── */}
            <section className="relative border-b border-[rgba(30,36,48,0.08)] bg-gradient-to-b from-[#F6F7F9] to-white py-12 sm:py-16 dark:border-[rgba(255,255,255,0.08)] dark:from-[#131722] dark:to-[#181E2B]">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#4A5FD1]/20 bg-[#4A5FD1]/10 px-3 py-1 text-xs font-semibold text-[#4A5FD1] dark:border-[#4A5FD1]/30 dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                <Users className="size-3.5" />
                                <span>Keorganisasian & Kepengurusan</span>
                            </div>
                            <h1 className="font-display text-3xl font-bold tracking-tight text-[#1E2430] sm:text-4xl lg:text-5xl dark:text-[#E6ECF5]">
                                Struktur Kepengurusan
                            </h1>
                            <p className="mt-3 text-xs leading-relaxed text-[#727C8E] sm:text-sm dark:text-[#8C97A8]">
                                Susunan pucuk pimpinan dan divisi kerja organisasi yang menggerakkan program kerja dan amanah komunitas periode {periode}.
                            </p>
                        </div>

                        {/* Periode Selector & Counter */}
                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto shrink-0">
                            {periodeList.length > 1 ? (
                                <div className="relative w-full sm:w-auto">
                                    <label htmlFor="periode-selector" className="sr-only">
                                        Pilih Periode Kepengurusan
                                    </label>
                                    <select
                                        id="periode-selector"
                                        value={periode}
                                        onChange={(e) => changePeriode(e.target.value)}
                                        className="w-full sm:w-auto appearance-none rounded-xl border border-[rgba(30,36,48,0.12)] bg-white py-2.5 pl-4 pr-10 text-xs sm:text-sm font-semibold text-[#1E2430] shadow-xs outline-none focus:border-[#4A5FD1] focus:ring-2 focus:ring-[#4A5FD1]/20 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5]"
                                    >
                                        {periodeList.map((p) => (
                                            <option key={p} value={p}>
                                                Periode {p}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#727C8E]" />
                                </div>
                            ) : (
                                <span className="font-mono-sigap rounded-lg bg-[#4A5FD1]/10 px-3 py-1.5 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                    Periode {periode}
                                </span>
                            )}

                            {!isEmpty && (
                                <span className="font-mono-sigap text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                    Total {totalPengurus} Pengurus Terdaftar
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Content Sections ── */}
            <div className="mx-auto max-w-6xl space-y-12 sm:space-y-16 px-4 py-10 sm:px-6 lg:px-8 min-h-screen">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgba(30,36,48,0.12)] bg-white py-20 text-center shadow-xs dark:border-[rgba(255,255,255,0.10)] dark:bg-[#181E2B]">
                        <User className="mb-3 size-12 text-[#727C8E]/40 dark:text-[#8C97A8]/40" />
                        <h3 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Belum Ada Data Struktur
                        </h3>
                        <p className="mt-1 max-w-md text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Data susunan pengurus untuk Periode {periode} belum ditambahkan atau sedang dalam tahap penyusunan oleh pengurus organisasi.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── 1. Pengurus Inti / Pucuk Pimpinan ── */}
                        {pengurusInti.length > 0 && (
                            <section>
                                <div className="mb-6 flex items-center justify-between gap-4 border-b border-[rgba(30,36,48,0.08)] pb-4 dark:border-[rgba(255,255,255,0.08)]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                            <Award className="size-4.5" />
                                        </div>
                                        <div>
                                            <h2 className="font-display text-xl font-bold tracking-tight text-[#1E2430] sm:text-2xl dark:text-[#E6ECF5]">
                                                Pengurus Inti
                                            </h2>
                                            <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                                Dewan pimpinan harian penanggung jawab utama organisasi
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-mono-sigap rounded-full bg-[#4A5FD1]/10 px-2.5 py-0.5 text-xs font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                                        {pengurusInti.length} Pengurus
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {pengurusInti.map((p) => (
                                        <IntiCard key={p.id} p={p} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ── 2. Divisi-Divisi Organisasi ── */}
                        {divisiList
                            .filter((d) => d.pengurus.length > 0)
                            .map((divisi) => (
                                <section key={divisi.id}>
                                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#2E9E82]/12 text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                                <Layers className="size-4" />
                                            </div>
                                            <div>
                                                <h3 className="font-display text-lg font-bold text-[#1E2430] sm:text-xl dark:text-[#E6ECF5]">
                                                    {divisi.nama_divisi}
                                                </h3>
                                                {divisi.deskripsi && (
                                                    <p className="text-xs text-[#727C8E] dark:text-[#8C97A8] mt-0.5">
                                                        {divisi.deskripsi}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="font-mono-sigap self-start sm:self-auto rounded-full bg-[#2E9E82]/10 px-2.5 py-0.5 text-xs font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
                                            {divisi.pengurus.length} Anggota
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                                        {divisi.pengurus.map((p) => (
                                            <MemberCard key={p.id} p={p} />
                                        ))}
                                    </div>
                                </section>
                            ))}
                    </>
                )}
            </div>
        </PublicLayout>
    );
}
