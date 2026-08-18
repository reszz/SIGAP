import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarCheck2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
    ExternalLink,
    Loader2,
    MapPin,
    Users,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { index as kalenderIndex } from '@/routes/kalender';
import pengurus from '@/routes/pengurus';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';
import { index as riwayatSayaIndex } from '@/routes/riwayat-saya';
import { show as kegiatanShow } from '@/routes/kegiatan';

// ─── Shared types ─────────────────────────────────────────────────────────────

type SesiMendatang = {
    id: number;
    kegiatanId: number;
    kegiatanNama: string;
    warna: string | null;
    tanggal: string;
    waktuMulai: string;
    lokasi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    kegiatanTipe: 'wajib_hadir' | 'terbuka';
    rsvpStatus: 'terdaftar' | 'dibatalkan' | null;
    kuota: number | null;
    kuotaTerpakai: number | null;
};

type PengurusStats = {
    totalKegiatan: number;
    totalAnggota: number;
    totalSesiSelesai: number;
};

type AnggotaStats = {
    totalKehadiran: number;
    rsvpAktif: number;
};

type RekapMember = {
    id: number;
    name: string;
    nim: string;
    hadir: number;
};

type AktivitasItem = {
    tipe: 'presensi';
    kegiatanNama: string;
    waktu: string;
};

type Props = {
    stats: PengurusStats | AnggotaStats;
    kegiatanMendatang: SesiMendatang[];
    rekapKehadiran?: RekapMember[];
    aktivitasTerbaru?: AktivitasItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BULAN_ID = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const HARI_PENDEK = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatTanggal(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

function formatTanggalPanjang(iso: string): string {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
    eventDates,
    teamSlug,
    selectedDate,
    onSelectDate,
}: {
    eventDates: Set<string>;
    teamSlug: string;
    selectedDate: string | null;
    onSelectDate: (date: string | null) => void;
}) {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const prevMonth = () => {
        if (viewMonth === 0) {
            setViewYear((y) => y - 1);
            setViewMonth(11);
        } else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) {
            setViewYear((y) => y + 1);
            setViewMonth(0);
        } else setViewMonth((m) => m + 1);
    };

    const cells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
            {/* Header navigation */}
            <div className="mb-3 flex items-center justify-between">
                <button
                    onClick={prevMonth}
                    className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    aria-label="Bulan sebelumnya"
                >
                    <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    {BULAN_ID[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={nextMonth}
                    className="flex size-7 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                    aria-label="Bulan berikutnya"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>

            {/* Day headers */}
            <div className="mb-1 grid grid-cols-7">
                {HARI_PENDEK.map((h) => (
                    <div
                        key={h}
                        className="py-1 text-center text-[10px] font-semibold tracking-wider text-neutral-400 uppercase"
                    >
                        {h}
                    </div>
                ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} />;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const hasEvent = eventDates.has(dateStr);
                    const isSelected = selectedDate === dateStr;

                    return (
                        <button
                            key={dateStr}
                            onClick={() =>
                                onSelectDate(isSelected ? null : dateStr)
                            }
                            className={`relative mx-auto flex size-8 items-center justify-center rounded-full text-xs font-medium transition-all ${
                                isSelected
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/40'
                                    : isToday
                                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-700'
                                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
                            }`}
                        >
                            {day}
                            {hasEvent && !isSelected && (
                                <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Link ke kalender penuh */}
            <div className="mt-4 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <Link
                    href={kalenderIndex.url(teamSlug)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-400"
                >
                    <ExternalLink className="size-3.5" />
                    Lihat Kalender Penuh
                </Link>
            </div>
        </div>
    );
}

// ─── Event list for selected date ─────────────────────────────────────────────

function EventHariIni({
    date,
    items,
    teamSlug,
}: {
    date: string;
    items: SesiMendatang[];
    teamSlug: string;
}) {
    const filtered = items.filter((s) => s.tanggal === date);

    return (
        <div className="mt-3 rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
            <p className="mb-2 text-xs font-semibold tracking-wider text-neutral-400 uppercase">
                {formatTanggalPanjang(date)}
            </p>
            {filtered.length === 0 ? (
                <p className="py-3 text-center text-xs text-neutral-400">
                    Tidak ada kegiatan pada hari ini.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {filtered.map((sesi) => (
                        <li key={sesi.id} className="flex items-start gap-2.5">
                            <span
                                className="mt-1 size-2.5 shrink-0 rounded-full"
                                style={{
                                    backgroundColor: sesi.warna ?? '#6366f1',
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={kegiatanShow.url({
                                        current_team: teamSlug,
                                        kegiatan: sesi.kegiatanId,
                                    })}
                                    className="block truncate text-xs font-medium text-neutral-800 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                                >
                                    {sesi.kegiatanNama}
                                </Link>
                                <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                                    <Clock className="size-2.5" />
                                    {sesi.waktuMulai.slice(0, 5)}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
// ─── Kegiatan Mendatang Badge ───────────────────────────────────────────────────
function SesiStatusBadge({
    sesi,
    teamSlug,
    onRsvpChange,
}: {
    sesi: SesiMendatang;
    teamSlug: string;
    onRsvpChange: (
        kegiatanId: number,
        newStatus: 'terdaftar' | 'dibatalkan',
        sisaKuota: number | null,
    ) => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Alert sukses hilang otomatis setelah beberapa detik
    useEffect(() => {
        if (!successMsg) return;
        const timer = setTimeout(() => setSuccessMsg(null), 3000);
        return () => clearTimeout(timer);
    }, [successMsg]);

    // Sesi sudah berlangsung / selesai — RSVP tidak relevan lagi, tampilkan status waktu
    if (sesi.status === 'berlangsung' || sesi.status === 'selesai') {
        const map = {
            berlangsung:
                'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
            selesai:
                'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
        } as const;
        const label = {
            berlangsung: 'Berlangsung',
            selesai: 'Selesai',
        } as const;

        return (
            <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${map[sesi.status]}`}
            >
                {label[sesi.status]}
            </span>
        );
    }

    // Sesi masih terjadwal — status yang relevan adalah kehadiran/RSVP
    if (sesi.kegiatanTipe === 'wajib_hadir') {
        return (
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                Wajib hadir
            </span>
        );
    }

    const sisaKuota =
        sesi.kuota != null && sesi.kuotaTerpakai != null
            ? sesi.kuota - sesi.kuotaTerpakai
            : null;

    async function handleRsvp() {
        if (loading) return;
        const yakin = window.confirm(
            `Daftar untuk kegiatan "${sesi.kegiatanNama}"?`,
        );
        if (!yakin) return;

        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ??
                [])[1];
            const res = await fetch(
                `/${teamSlug}/kegiatan/${sesi.kegiatanId}/rsvp`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(csrfToken ?? ''),
                    },
                    credentials: 'same-origin',
                },
            );
            const data = await res.json();
            if (res.ok) {
                onRsvpChange(
                    sesi.kegiatanId,
                    'terdaftar',
                    data.sisa_kuota ?? null,
                );
                setSuccessMsg('Berhasil terdaftar!');
            } else {
                setError(data.message ?? 'Gagal RSVP.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    }

    async function handleBatalRsvp() {
        if (loading) return;
        const yakin = window.confirm(
            `Batalkan RSVP kamu untuk "${sesi.kegiatanNama}"?`,
        );
        if (!yakin) return;

        setLoading(true);
        setError(null);
        setSuccessMsg(null);
        try {
            const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ??
                [])[1];
            const res = await fetch(
                `/${teamSlug}/kegiatan/${sesi.kegiatanId}/rsvp`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(csrfToken ?? ''),
                    },
                    credentials: 'same-origin',
                },
            );
            const data = await res.json();
            if (res.ok) {
                onRsvpChange(
                    sesi.kegiatanId,
                    'dibatalkan',
                    data.sisa_kuota ?? null,
                );
                setSuccessMsg('RSVP dibatalkan.');
            } else {
                setError(data.message ?? 'Gagal membatalkan RSVP.');
            }
        } catch {
            setError('Terjadi kesalahan jaringan.');
        } finally {
            setLoading(false);
        }
    }

    // Kegiatan Terbuka, sudah RSVP — checkmark hijau + tombol batalkan
    if (sesi.rsvpStatus === 'terdaftar') {
        return (
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        <Check className="size-3.5" />
                        Terdaftar
                    </span>
                    <button
                        type="button"
                        onClick={handleBatalRsvp}
                        disabled={loading}
                        className="rounded-full border border-red-200 px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                        {loading ? '...' : 'Batalkan'}
                    </button>
                </div>
                {error && (
                    <span className="max-w-[10rem] text-right text-[11px] text-red-500">
                        {error}
                    </span>
                )}
                {successMsg && !error && (
                    <span className="max-w-[10rem] text-right text-[11px] text-emerald-600 dark:text-emerald-400">
                        {successMsg}
                    </span>
                )}
            </div>
        );
    }

    // Kegiatan Terbuka, belum RSVP — ajakan aktif, amber
    return (
        <div className="flex flex-col items-end gap-0.5">
            <button
                type="button"
                onClick={handleRsvp}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading && <Loader2 className="size-3.5 animate-spin" />}
                {loading ? 'Mendaftar...' : 'RSVP sekarang'}
            </button>
            {error ? (
                <span className="max-w-[10rem] text-right text-[11px] text-red-500">
                    {error}
                </span>
            ) : successMsg ? (
                <span className="max-w-[10rem] text-right text-[11px] text-emerald-600 dark:text-emerald-400">
                    {successMsg}
                </span>
            ) : (
                sisaKuota != null && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400">
                        {sisaKuota} dari {sesi.kuota} slot tersisa
                    </span>
                )
            )}
        </div>
    );
}
// ─── Kegiatan Mendatang Card ───────────────────────────────────────────────────

function KegiatanMendatangCard({
    items,
    teamSlug,
    onRsvpChange,
}: {
    items: SesiMendatang[];
    teamSlug: string;
    onRsvpChange: (
        kegiatanId: number,
        newStatus: 'terdaftar' | 'dibatalkan',
        sisaKuota: number | null,
    ) => void;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
            <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                <Calendar className="size-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                    Kegiatan Mendatang
                </h3>
                <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    30 hari ke depan
                </span>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Calendar className="size-8 text-neutral-200 dark:text-neutral-700" />
                    <p className="text-sm text-neutral-400">
                        Tidak ada kegiatan dalam 30 hari ke depan.
                    </p>
                </div>
            ) : (
                <ul className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                    {items.map((sesi) => (
                        <li
                            key={sesi.id}
                            className={cn(
                                'group flex items-start gap-3.5 px-5 py-3.5 transition hover:bg-neutral-50/80 dark:hover:bg-neutral-800/30',
                                sesi.status === 'terjadwal' &&
                                    sesi.kegiatanTipe === 'terbuka' &&
                                    sesi.rsvpStatus !== 'terdaftar' &&
                                    'bg-amber-50/50 dark:bg-amber-950/10',
                            )}
                        >
                            <span
                                className="mt-1 size-3 shrink-0 rounded-full ring-2 ring-white dark:ring-neutral-900"
                                style={{
                                    backgroundColor: sesi.warna ?? '#6366f1',
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <Link
                                    href={kegiatanShow.url({
                                        current_team: teamSlug,
                                        kegiatan: sesi.kegiatanId,
                                    })}
                                    className="truncate text-sm font-medium text-neutral-800 transition group-hover:text-indigo-600 dark:text-neutral-100 dark:group-hover:text-indigo-400"
                                >
                                    {sesi.kegiatanNama}
                                </Link>
                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="size-3" />
                                        {formatTanggal(sesi.tanggal)} ·{' '}
                                        {sesi.waktuMulai.slice(0, 5)}
                                    </span>
                                    {sesi.lokasi && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            {sesi.lokasi}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <SesiStatusBadge
                                sesi={sesi}
                                teamSlug={teamSlug}
                                onRsvpChange={onRsvpChange}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    gradient,
    bg,
    text,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    gradient: string;
    bg: string;
    text: string;
}) {
    return (
        <div
            className={`group relative overflow-hidden rounded-lg border border-sidebar-border/70 sm:rounded-2xl ${bg} p-3 shadow-sm transition hover:shadow-md sm:p-5 dark:border-sidebar-border`}
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p
                        className={`text-xs font-semibold tracking-wider uppercase ${text} opacity-80`}
                    >
                        {label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-neutral-800 sm:mt-2 sm:text-3xl dark:text-neutral-100">
                        {value}
                    </p>
                </div>
                <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:size-11 sm:rounded-xl ${gradient} shadow-md`}
                >
                    <Icon className="size-4 text-white sm:size-5" />
                </div>
            </div>
            {/* subtle decorative background ring */}
            <div
                className={`pointer-events-none absolute -right-4 -bottom-4 size-20 rounded-full bg-gradient-to-br ${gradient} opacity-10`}
            />
        </div>
    );
}

// ─── Pengurus dashboard ───────────────────────────────────────────────────────

function PengurusDashboard({
    stats,
    kegiatanMendatang,
}: {
    stats: PengurusStats;
    kegiatanMendatang: SesiMendatang[];
}) {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [sesiList, setSesiList] = useState(kegiatanMendatang);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const eventDates = new Set(sesiList.map((s) => s.tanggal));

    const handleRsvpChange = useCallback(
        (
            kegiatanId: number,
            newStatus: 'terdaftar' | 'dibatalkan',
            sisaKuota: number | null,
        ) => {
            setSesiList((prev) =>
                prev.map((s) =>
                    s.kegiatanId === kegiatanId
                        ? {
                              ...s,
                              rsvpStatus: newStatus,
                              kuotaTerpakai:
                                  sisaKuota != null && s.kuota != null
                                      ? s.kuota - sisaKuota
                                      : s.kuotaTerpakai,
                          }
                        : s,
                ),
            );
        },
        [],
    );

    const today = new Date();
    const todayFormatted = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const statCards = [
        {
            label: 'Total Kegiatan',
            value: stats.totalKegiatan,
            icon: ClipboardList,
            gradient: 'from-violet-500 to-indigo-500',
            bg: 'bg-violet-50 dark:bg-violet-950/20',
            text: 'text-violet-600 dark:text-violet-400',
        },
        {
            label: 'Total Anggota',
            value: stats.totalAnggota,
            icon: Users,
            gradient: 'from-sky-500 to-cyan-400',
            bg: 'bg-sky-50 dark:bg-sky-950/20',
            text: 'text-sky-600 dark:text-sky-400',
        },
        {
            label: 'Sesi Selesai',
            value: stats.totalSesiSelesai,
            icon: CalendarCheck2,
            gradient: 'from-emerald-500 to-teal-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* ── Welcome banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 px-4 py-5 text-white shadow-lg sm:px-6 sm:py-7">
                {/* decorative blobs */}
                <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-white/5 blur-2xl" />
                <div className="pointer-events-none absolute right-16 bottom-0 size-24 rounded-full bg-indigo-400/20 blur-xl" />

                <div className="relative flex flex-col gap-3 sm:gap-4">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
                            Panel Pengurus
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                            Selamat datang kembali! 👋
                        </h2>
                        <p className="mt-0.5 text-xs opacity-60 sm:text-sm">
                            {todayFormatted}
                        </p>
                        <p className="mt-2 max-w-sm text-xs opacity-75 sm:text-sm">
                            Kelola kegiatan, pantau kehadiran anggota, dan susun
                            laporan dari sini.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={pengurus.kegiatan.create.url(teamSlug)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <ClipboardList className="size-3.5 sm:size-4" />
                            <span className="hidden sm:inline">
                                Buat Kegiatan
                            </span>
                            <span className="sm:hidden">Buat</span>
                        </Link>
                        <Link
                            href={pengurus.anggota.index.url(teamSlug)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <Users className="size-3.5 sm:size-4" />
                            <span className="hidden sm:inline">
                                Kelola Anggota
                            </span>
                            <span className="sm:hidden">Anggota</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:flex-row">
                {/* ── Left column ── */}
                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
                    {/* Stat cards */}
                    <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>

                    {/* Kegiatan mendatang */}
                    <KegiatanMendatangCard
                        items={sesiList}
                        teamSlug={teamSlug}
                        onRsvpChange={handleRsvpChange}
                    />
                </div>

                {/* ── Right column — Mini Calendar ── */}
                <div className="flex w-full flex-col gap-3 sm:gap-4 lg:w-72 lg:shrink-0">
                    <MiniCalendar
                        eventDates={eventDates}
                        teamSlug={teamSlug}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                    {selectedDate && (
                        <EventHariIni
                            date={selectedDate}
                            items={sesiList}
                            teamSlug={teamSlug}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Anggota dashboard ────────────────────────────────────────────────────────

function AnggotaDashboard({
    stats,
    kegiatanMendatang,
    aktivitasTerbaru,
}: {
    stats: AnggotaStats;
    kegiatanMendatang: SesiMendatang[];
    aktivitasTerbaru?: AktivitasItem[];
}) {
    const { auth, currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [sesiList, setSesiList] = useState(kegiatanMendatang);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const eventDates = new Set(sesiList.map((s) => s.tanggal));

    const handleRsvpChange = useCallback(
        (
            kegiatanId: number,
            newStatus: 'terdaftar' | 'dibatalkan',
            sisaKuota: number | null,
        ) => {
            setSesiList((prev) =>
                prev.map((s) =>
                    s.kegiatanId === kegiatanId
                        ? {
                              ...s,
                              rsvpStatus: newStatus,
                              kuotaTerpakai:
                                  sisaKuota != null && s.kuota != null
                                      ? s.kuota - sisaKuota
                                      : s.kuotaTerpakai,
                          }
                        : s,
                ),
            );
        },
        [],
    );

    const firstName = auth.user.name.split(' ')[0];
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const statCards = [
        {
            label: 'Total Kehadiran Saya',
            value: stats.totalKehadiran,
            icon: CalendarCheck2,
            gradient: 'from-emerald-500 to-teal-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'RSVP Aktif',
            value: stats.rsvpAktif,
            icon: ClipboardList,
            gradient: 'from-amber-500 to-orange-400',
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-600 dark:text-amber-400',
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col">
            {/* ── Welcome banner ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500 px-4 py-5 text-white shadow-lg sm:px-6 sm:py-7">
                <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-white/5 blur-2xl" />
                <div className="pointer-events-none absolute right-16 bottom-0 size-24 rounded-full bg-teal-400/20 blur-xl" />

                <div className="relative flex flex-col gap-3 sm:gap-4">
                    <div>
                        <p className="text-xs font-semibold tracking-widest uppercase opacity-70">
                            Portal Anggota
                        </p>
                        <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                            Halo, {firstName}! 👋
                        </h2>
                        <p className="mt-0.5 text-xs opacity-60 sm:text-sm">
                            {todayFormatted}
                        </p>
                        <p className="mt-2 max-w-sm text-xs opacity-75 sm:text-sm">
                            Cek kegiatan mendatang, isi presensi, dan pantau
                            keaktifanmu di sini.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={
                                teamSlug
                                    ? riwayatSayaIndex.url(teamSlug)
                                    : '/riwayat-saya'
                            }
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                        >
                            <CalendarCheck2 className="size-3.5 sm:size-4" />
                            <span>Riwayat Saya</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Main content ── */}
            <div className="flex flex-1 flex-col gap-4 p-3 sm:gap-5 sm:p-5 lg:flex-row">
                {/* ── Left column ── */}
                <div className="flex min-w-0 flex-1 flex-col gap-4 sm:gap-5">
                    {/* Stat cards */}
                    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        {statCards.map((card) => (
                            <StatCard key={card.label} {...card} />
                        ))}
                    </div>

                    {/* Kegiatan mendatang */}
                    <KegiatanMendatangCard
                        items={sesiList}
                        teamSlug={teamSlug}
                        onRsvpChange={handleRsvpChange}
                    />

                    {/* Aktivitas terbaru */}
                    {aktivitasTerbaru && aktivitasTerbaru.length > 0 && (
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
                            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3 sm:px-5 sm:py-4 dark:border-neutral-800">
                                <CalendarCheck2 className="size-4 text-emerald-500" />
                                <h3 className="text-xs font-semibold text-neutral-800 sm:text-sm dark:text-neutral-100">
                                    Presensi Terakhir Saya
                                </h3>
                            </div>
                            <ul className="divide-y divide-neutral-50 dark:divide-neutral-800/60">
                                {aktivitasTerbaru.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3"
                                    >
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                                            <CalendarCheck2 className="size-3.5 text-emerald-500" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-medium text-neutral-800 sm:text-sm dark:text-neutral-100">
                                                {item.kegiatanNama}
                                            </p>
                                            <p className="text-xs text-neutral-400">
                                                {new Date(
                                                    item.waktu,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ── Right column — Mini Calendar ── */}
                <div className="flex w-full flex-col gap-3 sm:gap-4 lg:w-72 lg:shrink-0">
                    <MiniCalendar
                        eventDates={eventDates}
                        teamSlug={teamSlug}
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                    />
                    {selectedDate && (
                        <EventHariIni
                            date={selectedDate}
                            items={sesiList}
                            teamSlug={teamSlug}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function Dashboard({
    stats,
    kegiatanMendatang,
    rekapKehadiran,
    aktivitasTerbaru,
}: Props) {
    const { auth } = usePage().props;
    const isPengurus = auth.user.role === 'pengurus';

    return (
        <>
            <Head title="Dashboard" />
            {isPengurus ? (
                <PengurusDashboard
                    stats={stats as PengurusStats}
                    kegiatanMendatang={kegiatanMendatang}
                    rekapKehadiran={rekapKehadiran}
                />
            ) : (
                <AnggotaDashboard
                    stats={stats as AnggotaStats}
                    kegiatanMendatang={kegiatanMendatang}
                    aktivitasTerbaru={aktivitasTerbaru}
                />
            )}
        </>
    );
}

Dashboard.layout = (props: {
    currentTeam?: { slug: string } | null;
    auth?: { user?: { role?: string } };
}) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam
                ? props.auth?.user?.role === 'pengurus'
                    ? pengurusDashboard.url(props.currentTeam.slug)
                    : anggotaDashboard.url(props.currentTeam.slug)
                : '/',
        },
    ],
});
