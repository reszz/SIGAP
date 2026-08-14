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
        month: 'long',
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
    return text.length > max ? text.slice(0, max) + '\u2026' : text;
}

// ─── Shared components ────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
    return (
        <p className="py-6 text-center text-sm text-neutral-400">{message}</p>
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
        <section className="rounded-xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-neutral-900">
            <div className="mb-4 flex items-center gap-2">
                <span className="text-indigo-600 dark:text-indigo-400">
                    {icon}
                </span>
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {title}
                </h2>
            </div>
            {children}
        </section>
    );
}

function RsvpStatusBadge({ status }: { status: RiwayatRsvpItem['status'] }) {
    const styles: Record<RiwayatRsvpItem['status'], string> = {
        terdaftar:
            'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        dibatalkan:
            'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
        >
            {status}
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

            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
                <header>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        Riwayat Saya
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500">
                        Rekap keikutsertaanmu di team ini — RSVP, presensi, dan
                        evaluasi.
                    </p>
                </header>

                {/* ── Section RSVP ───────────────────────────────────────── */}
                <Section
                    title="Riwayat RSVP"
                    icon={<ClipboardList className="size-5" />}
                >
                    {riwayatRsvp.length === 0 ? (
                        <EmptyState message="Belum ada riwayat RSVP di team ini." />
                    ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {riwayatRsvp.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                            {item.kegiatanNama}
                                        </p>
                                        {item.waktuDaftar && (
                                            <p className="mt-0.5 text-xs text-neutral-500">
                                                Daftar:{' '}
                                                {formatTanggal(item.waktuDaftar)}
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
                    icon={<CalendarCheck2 className="size-5" />}
                >
                    {riwayatPresensi.length === 0 ? (
                        <EmptyState message="Belum ada riwayat presensi di team ini." />
                    ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {riwayatPresensi.map((item) => (
                                <li
                                    key={item.id}
                                    className="py-3 first:pt-0 last:pb-0"
                                >
                                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                        {item.kegiatanNama}
                                    </p>
                                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-500">
                                        <span>
                                            Tanggal sesi:{' '}
                                            {item.sesiTanggal
                                                ? formatTanggal(item.sesiTanggal)
                                                : '-'}
                                        </span>
                                        <span>
                                            Presensi:{' '}
                                            {item.waktuIsi
                                                ? formatWaktu(item.waktuIsi)
                                                : '-'}
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
                    icon={<Star className="size-5" />}
                >
                    {riwayatEvaluasi.length === 0 ? (
                        <EmptyState message="Belum ada riwayat evaluasi di team ini." />
                    ) : (
                        <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {riwayatEvaluasi.map((item) => (
                                <li
                                    key={item.id}
                                    className="py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                            {item.kegiatanNama}
                                        </p>
                                        <span className="shrink-0 text-sm text-amber-500">
                                            {'★'.repeat(item.rating)}
                                            <span className="ml-1 text-xs text-neutral-500">
                                                {item.rating}/5
                                            </span>
                                        </span>
                                    </div>
                                    {item.komentar && (
                                        <p className="mt-1 text-sm text-neutral-500">
                                            {truncate(item.komentar)}
                                        </p>
                                    )}
                                    <p className="mt-0.5 text-xs text-neutral-400">
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
