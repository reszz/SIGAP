import { Head } from '@inertiajs/react';
import { CalendarCheck2, ClipboardList, Star } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RiwayatRsvpItem = {
    id: number;
    kegiatanNama: string;
    kegiatanId: number;
    status: 'terdaftar' | 'dibatalkan';
    waktuDaftar: string | null;
};

type RiwayatPresensiItem = {
    id: number;
    kegiatanNama: string;
    sesiTanggal: string | null;
    waktuIsi: string | null;
};

type RiwayatEvaluasiItem = {
    id: number;
    kegiatanNama: string;
    kegiatanId: number;
    rating: number;
    komentar: string | null;
    tanggal: string;
};

type Props = {
    riwayatRsvp: RiwayatRsvpItem[];
    riwayatPresensi: RiwayatPresensiItem[];
    riwayatEvaluasi: RiwayatEvaluasiItem[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTanggal(iso: string): string {
    return new Date(iso).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function formatWaktu(iso: string): string {
    return new Date(iso).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function truncate(text: string, max = 200): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

// ─── Shared components ────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
    return (
        <p className="py-6 text-center text-xs italic text-[#727C8E]/70 dark:text-[#8C97A8]/70">{message}</p>
    );
}

function Section({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
            <div className="mb-4 flex items-center gap-2 border-b border-[rgba(30,36,48,0.08)] pb-3.5 dark:border-[rgba(255,255,255,0.08)]">
                <span className="text-[#4A5FD1] dark:text-[#8FA0FA]">
                    {icon}
                </span>
                <h2 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                    {title}
                </h2>
            </div>
            {children}
        </section>
    );
}

function RsvpStatusBadge({ status }: { status: RiwayatRsvpItem['status'] }) {
    return status === 'terdaftar' ? (
        <span className="inline-flex items-center rounded-md bg-[#2E9E82]/12 px-2.5 py-0.5 text-xs font-semibold text-[#2E9E82] dark:bg-[#2E9E82]/20 dark:text-[#34B394]">
            Terdaftar
        </span>
    ) : (
        <span className="inline-flex items-center rounded-md bg-[#727C8E]/12 px-2.5 py-0.5 text-xs font-semibold text-[#727C8E] dark:bg-[#727C8E]/20 dark:text-[#8C97A8]">
            Dibatalkan
        </span>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiwayatSaya({
    riwayatRsvp,
    riwayatPresensi,
    riwayatEvaluasi,
}: Props) {
    return (
        <>
            <Head title="Riwayat Saya" />

            <div className="flex h-full flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
                <header>
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-[#1E2430] sm:text-3xl dark:text-[#E6ECF5]">
                        Riwayat Saya
                    </h1>
                    <p className="mt-0.5 text-xs text-[#727C8E] dark:text-[#8C97A8]">
                        Rekapitulasi keikutsertaan kegiatan — RSVP, presensi, dan ulasan evaluasi
                    </p>
                </header>

                {/* ── Section RSVP ───────────────────────────────────────── */}
                <Section
                    title="Riwayat RSVP"
                    icon={<ClipboardList className="size-4" />}
                >
                    {riwayatRsvp.length === 0 ? (
                        <EmptyState message="Belum ada riwayat RSVP di team ini." />
                    ) : (
                        <ul className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {riwayatRsvp.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {item.kegiatanNama}
                                        </p>
                                        {item.waktuDaftar && (
                                            <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                                Daftar: {formatTanggal(item.waktuDaftar)}
                                            </p>
                                        )}
                                    </div>
                                    <RsvpStatusBadge status={item.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {/* ── Section Presensi ───────────────────────────────────── */}
                <Section
                    title="Riwayat Presensi"
                    icon={<CalendarCheck2 className="size-4" />}
                >
                    {riwayatPresensi.length === 0 ? (
                        <EmptyState message="Belum ada riwayat presensi di team ini." />
                    ) : (
                        <ul className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {riwayatPresensi.map((item) => (
                                <li
                                    key={item.id}
                                    className="py-3 first:pt-0 last:pb-0"
                                >
                                    <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                        {item.kegiatanNama}
                                    </p>
                                    <div className="font-mono-sigap mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        <span>
                                            Sesi: {item.sesiTanggal ? formatTanggal(item.sesiTanggal) : '—'}
                                        </span>
                                        <span>
                                            Waktu Presensi: {item.waktuIsi ? formatWaktu(item.waktuIsi) : '—'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                {/* ── Section Evaluasi ───────────────────────────────────── */}
                <Section
                    title="Riwayat Evaluasi"
                    icon={<Star className="size-4" />}
                >
                    {riwayatEvaluasi.length === 0 ? (
                        <EmptyState message="Belum ada riwayat evaluasi di team ini." />
                    ) : (
                        <ul className="divide-y divide-[rgba(30,36,48,0.06)] dark:divide-[rgba(255,255,255,0.06)]">
                            {riwayatEvaluasi.map((item) => (
                                <li
                                    key={item.id}
                                    className="py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-xs font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                            {item.kegiatanNama}
                                        </p>
                                        <span className="font-mono-sigap shrink-0 text-xs font-semibold text-[#B8862E] dark:text-[#D4A142]">
                                            ★ {item.rating} / 5
                                        </span>
                                    </div>
                                    {item.komentar && (
                                        <p className="mt-1 text-xs text-[#2E3542] dark:text-[#E6ECF5]">
                                            &ldquo;{truncate(item.komentar)}&rdquo;
                                        </p>
                                    )}
                                    <p className="font-mono-sigap mt-0.5 text-[11px] text-[#727C8E] dark:text-[#8C97A8]">
                                        {formatTanggal(item.tanggal)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </div>
        </>
    );
}

RiwayatSaya.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Riwayat Saya',
            href: props.currentTeam
                ? `/${props.currentTeam.slug}/riwayat-saya`
                : '/riwayat-saya',
        },
    ],
});
