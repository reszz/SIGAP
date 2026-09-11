import { router } from '@inertiajs/react';
import { MapPin, Clock, ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import PublicLayout from '@/layouts/public-layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type SesiItem = {
    tanggal: string;        // "YYYY-MM-DD"
    nama_kegiatan: string;
    waktu_mulai: string;    // "HH:MM"
    waktu_selesai: string;  // "HH:MM"
    lokasi: string | null;
    warna: string;
    deskripsi: string | null;
};

type Props = {
    sesi: SesiItem[];
    bulan: number;   // 1–12
    tahun: number;
    defaultDate: string | null; // "YYYY-MM-DD" kegiatan mendatang terdekat
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BULAN_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const HARI_PANJANG_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTanggalPanjang(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return `${HARI_PANJANG_ID[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
}

function toDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function buildCalendarGrid(year: number, month: number): (string | null)[] {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
        cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) {
        cells.push(null);
    }
    return cells;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventDots({ events }: { events: SesiItem[] }) {
    if (events.length === 0) return null;
    const visible = events.slice(0, 3);
    const extra = events.length - 3;

    return (
        <div className="mt-0.5 flex items-center justify-center gap-0.5">
            {visible.map((e, i) => (
                <span
                    key={i}
                    className="block size-[5px] rounded-full shrink-0"
                    style={{ backgroundColor: e.warna }}
                />
            ))}
            {extra > 0 && (
                <span className="font-mono-sigap text-[9px] font-semibold text-[#727C8E] dark:text-[#8C97A8]">
                    +{extra}
                </span>
            )}
        </div>
    );
}

function AgendaCard({ item }: { item: SesiItem }) {
    return (
        <div className="overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
            {/* Color bar */}
            <div className="h-[3px]" style={{ backgroundColor: item.warna }} />
            <div className="p-4">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <p className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                        {item.nama_kegiatan}
                    </p>
                    <span className="font-mono-sigap inline-flex shrink-0 items-center gap-1 rounded-md bg-[#4A5FD1]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                        <Clock className="size-3" />
                        {item.waktu_mulai}–{item.waktu_selesai}
                    </span>
                </div>
                {item.lokasi && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                        <MapPin className="size-3.5 shrink-0" />
                        {item.lokasi}
                    </p>
                )}
                {item.deskripsi && (
                    <p className="mt-2 text-xs leading-relaxed text-[#2E3542] dark:text-[#CBD5E1]">
                        {item.deskripsi}{item.deskripsi.length >= 100 ? '…' : ''}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KalenderPublik({ sesi, bulan, tahun, defaultDate }: Props) {
    const [selectedDate, setSelectedDate] = useState<string | null>(defaultDate);

    const today = toDateString(new Date());

    const sesiByDate = useMemo(() => {
        const map = new Map<string, SesiItem[]>();
        for (const item of sesi) {
            if (!map.has(item.tanggal)) map.set(item.tanggal, []);
            map.get(item.tanggal)!.push(item);
        }
        return map;
    }, [sesi]);

    const calendarCells = useMemo(() => buildCalendarGrid(tahun, bulan), [tahun, bulan]);

    const selectedAgenda = selectedDate ? (sesiByDate.get(selectedDate) ?? []) : [];

    const navigateBulan = useCallback((delta: number) => {
        let b = bulan + delta;
        let t = tahun;
        if (b < 1) { b = 12; t -= 1; }
        if (b > 12) { b = 1; t += 1; }
        router.visit(`/kalender?bulan=${b}&tahun=${t}`, { preserveScroll: false });
    }, [bulan, tahun]);

    const prevLabel = (() => {
        let b = bulan - 1;
        let t = tahun;
        if (b < 1) { b = 12; t -= 1; }
        return `${BULAN_ID[b - 1]} ${t}`;
    })();

    const nextLabel = (() => {
        let b = bulan + 1;
        let t = tahun;
        if (b > 12) { b = 1; t += 1; }
        return `${BULAN_ID[b - 1]} ${t}`;
    })();

    return (
        <PublicLayout
            title="Kalender Kegiatan — SIGAP"
            description="Jadwal kegiatan organisasi mahasiswa yang terbuka untuk umum."
        >
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-screen">
                {/* Page title */}
                <div className="mb-6">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                        Kalender Kegiatan
                    </h1>
                    <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                        Jadwal kegiatan organisasi yang terbuka untuk umum. Klik tanggal untuk melihat agenda.
                    </p>
                </div>

                {/* ── Calendar Card ── */}
                <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-xs dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    {/* Calendar header — bulan navigasi */}
                    <div className="flex items-center justify-between border-b border-[rgba(30,36,48,0.08)] px-5 py-4 dark:border-[rgba(255,255,255,0.08)]">
                        <button
                            onClick={() => navigateBulan(-1)}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#0E121A] dark:hover:text-[#E6ECF5]"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span className="hidden sm:inline">{prevLabel}</span>
                        </button>

                        <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            {BULAN_ID[bulan - 1]} {tahun}
                        </h2>

                        <button
                            onClick={() => navigateBulan(1)}
                            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[#727C8E] transition hover:bg-[#F6F7F9] hover:text-[#1E2430] dark:text-[#8C97A8] dark:hover:bg-[#0E121A] dark:hover:text-[#E6ECF5]"
                        >
                            <span className="hidden sm:inline">{nextLabel}</span>
                            <ArrowRight className="size-3.5" />
                        </button>
                    </div>

                    {/* Day labels */}
                    <div className="grid grid-cols-7 border-b border-[rgba(30,36,48,0.08)] dark:border-[rgba(255,255,255,0.08)]">
                        {HARI_ID.map((h) => (
                            <div
                                key={h}
                                className="py-2.5 text-center font-mono-sigap text-[10px] font-semibold uppercase tracking-wider text-[#727C8E] dark:text-[#8C97A8]"
                            >
                                {h}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7">
                        {calendarCells.map((cell, idx) => {
                            if (!cell) {
                                return (
                                    <div
                                        key={`empty-${idx}`}
                                        className="min-h-[46px] sm:min-h-[56px] border-b border-r border-[rgba(30,36,48,0.06)] dark:border-[rgba(255,255,255,0.06)] last:border-r-0 [&:nth-child(7n)]:border-r-0"
                                    />
                                );
                            }

                            const isToday = cell === today;
                            const isSelected = cell === selectedDate;
                            const events = sesiByDate.get(cell) ?? [];
                            const hasEvents = events.length > 0;

                            return (
                                <button
                                    key={cell}
                                    onClick={() => setSelectedDate(cell)}
                                    className={[
                                        'group relative flex min-h-[46px] sm:min-h-[56px] flex-col items-center pt-1.5 sm:pt-2 pb-1 sm:pb-1.5 transition',
                                        'border-b border-r border-[rgba(30,36,48,0.06)] dark:border-[rgba(255,255,255,0.06)]',
                                        '[&:nth-child(7n)]:border-r-0',
                                        isSelected
                                            ? 'bg-[#4A5FD1]/8 dark:bg-[#4A5FD1]/15'
                                            : 'hover:bg-[#F6F7F9] dark:hover:bg-[#0E121A]',
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'font-mono-sigap flex size-6 sm:size-7 items-center justify-center rounded-full text-[11px] sm:text-xs font-semibold',
                                            isToday && isSelected
                                                ? 'bg-[#4A5FD1] text-white'
                                                : isToday
                                                    ? 'ring-2 ring-[#4A5FD1] text-[#4A5FD1] dark:text-[#8FA0FA]'
                                                    : isSelected
                                                        ? 'bg-[#4A5FD1] text-white'
                                                        : hasEvents
                                                            ? 'text-[#1E2430] dark:text-[#E6ECF5]'
                                                            : 'text-[#727C8E] dark:text-[#8C97A8]',
                                        ].join(' ')}
                                    >
                                        {new Date(cell + 'T00:00:00').getDate()}
                                    </span>
                                    <EventDots events={events} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Agenda Panel ── */}
                {selectedDate && (
                    <section className="mt-6" id="agenda-panel">
                        <div className="mb-3 flex items-center gap-2">
                            <CalendarDays className="size-4 text-[#4A5FD1] dark:text-[#8FA0FA]" />
                            <h2 className="font-display text-base font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {formatTanggalPanjang(selectedDate)}
                            </h2>
                        </div>

                        {selectedAgenda.length === 0 ? (
                            <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white px-5 py-8 text-center dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                                <p className="text-xs italic text-[#727C8E] dark:text-[#8C97A8]">
                                    Tidak ada kegiatan terjadwal.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {selectedAgenda.map((item, i) => (
                                    <AgendaCard key={i} item={item} />
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </PublicLayout>
    );
}
