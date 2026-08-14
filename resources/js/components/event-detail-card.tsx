import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ClipboardList,
    Clock,
    Loader2,
    MapPin,
    Tag,
    Users,
    X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type RundownItem = {
    id: number;
    waktu: string;
    uraian_acara: string;
    urutan: number;
};

type Sesi = {
    id: number;
    tanggal: string;
    waktu_mulai: string;
    waktu_selesai: string;
    lokasi: string;
    kode_presensi: string;
    status: 'terjadwal' | 'berlangsung' | 'selesai';
    rundown: RundownItem[];
};

type TugasPanitia = {
    id: number;
    deskripsi_tugas: string;
    status: 'belum' | 'sedang' | 'selesai';
    user: { id: number; name: string } | null;
};

type DivisiPanitia = {
    id: number;
    nama_divisi: string;
    tugas_panitia: TugasPanitia[];
};

type KegiatanDetail = {
    id: number;
    nama: string;
    deskripsi: string | null;
    tipe: 'wajib_hadir' | 'terbuka';
    kuota: number | null;
    warna: string;
    sesi: Sesi[];
    divisi_panitia: DivisiPanitia[];
};

type RsvpStatus = 'terdaftar' | 'dibatalkan' | null;

type Props = {
    kegiatanId: number | null;
    onClose: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_MAP = {
    terjadwal: {
        label: 'Terjadwal',
        cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    },
    berlangsung: {
        label: 'Berlangsung',
        cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    },
    selesai: {
        label: 'Selesai',
        cls: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    },
};

const TUGAS_STATUS_CLS: Record<TugasPanitia['status'], string> = {
    belum: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
    sedang: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    selesai: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function formatTanggal(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function EventDetailCard({ kegiatanId, onClose }: Props) {
    const { auth, currentTeam } = usePage().props;
    const isPengurus = auth.user.role === 'pengurus';
    const teamSlug = currentTeam?.slug ?? '';

    const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(null);
    const [sisaKuota, setSisaKuota] = useState<number | null>(null);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpMsg, setRsvpMsg] = useState<string | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);

    // Fetch detail kegiatan
    useEffect(() => {
        if (!kegiatanId) return;
        setLoading(true);
        setError(null);
        setKegiatan(null);
        setRsvpStatus(null);
        setSisaKuota(null);
        setRsvpMsg(null);

        fetch(`/${teamSlug}/kegiatan/${kegiatanId}`, {
            headers: { Accept: 'application/json' },
        })
            .then((r) => r.json())
            .then((data: KegiatanDetail) => {
                setKegiatan(data);
                if (!isPengurus && data.tipe === 'terbuka') {
                    return fetch(`/${teamSlug}/kegiatan/${kegiatanId}/rsvp/status`)
                        .then((r) => (r.ok ? r.json() : null))
                        .then((s) => {
                            if (s) {
                                setRsvpStatus(s.status);
                                setSisaKuota(s.sisa_kuota);
                            }
                        })
                        .catch(() => {});
                }
            })
            .catch(() => setError('Gagal memuat detail kegiatan.'))
            .finally(() => setLoading(false));
    }, [kegiatanId]);

    // Close on Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    async function handleRsvp() {
        if (!kegiatan || rsvpLoading) return;
        setRsvpLoading(true);
        setRsvpMsg(null);
        try {
            const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1];
            const r = await fetch(`/${teamSlug}/kegiatan/${kegiatan.id}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(csrfToken ?? ''),
                },
                credentials: 'same-origin',
            });
            const data = await r.json();
            if (r.ok) {
                setRsvpStatus('terdaftar');
                setSisaKuota(data.sisa_kuota);
                setRsvpMsg('Berhasil terdaftar!');
            } else {
                setRsvpMsg(data.message ?? 'Gagal RSVP.');
            }
        } catch {
            setRsvpMsg('Terjadi kesalahan jaringan.');
        } finally {
            setRsvpLoading(false);
        }
    }

    async function handleBatalRsvp() {
        if (!kegiatan || rsvpLoading) return;
        if (!confirm('Batalkan RSVP kamu?')) return;
        setRsvpLoading(true);
        setRsvpMsg(null);
        try {
            const csrfToken = (document.cookie.match(/XSRF-TOKEN=([^;]+)/) ?? [])[1];
            const r = await fetch(`/${teamSlug}/kegiatan/${kegiatan.id}/rsvp`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(csrfToken ?? ''),
                },
                credentials: 'same-origin',
            });
            const data = await r.json();
            if (r.ok) {
                setRsvpStatus('dibatalkan');
                setSisaKuota(data.sisa_kuota);
                setRsvpMsg('RSVP dibatalkan.');
            } else {
                setRsvpMsg(data.message ?? 'Gagal membatalkan RSVP.');
            }
        } catch {
            setRsvpMsg('Terjadi kesalahan jaringan.');
        } finally {
            setRsvpLoading(false);
        }
    }

    if (!kegiatanId) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-white shadow-2xl sm:border-l sm:border-neutral-200 dark:bg-neutral-900 sm:dark:border-neutral-800"
            >
                {/* Header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-neutral-100 p-4 dark:border-neutral-800">
                    {kegiatan && (
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: kegiatan.warna }}
                        />
                    )}
                    <h2 className="flex-1 truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {loading ? 'Memuat...' : (kegiatan?.nama ?? 'Detail Kegiatan')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Link ke halaman penuh */}
                {kegiatan && (
                    <Link
                        href={`/${teamSlug}/kegiatan/${kegiatan.id}/detail`}
                        className="mx-4 mt-4 inline-flex items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                    >
                        Buka halaman detail lengkap →
                    </Link>
                )}

                {/* Konten scroll */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="size-6 animate-spin text-indigo-500" />
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {kegiatan && !loading && (
                        <div className="flex flex-col gap-5">
                            {/* Tipe + deskripsi */}
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                            kegiatan.tipe === 'terbuka'
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                        }`}
                                    >
                                        <Tag className="mr-1 size-3" />
                                        {kegiatan.tipe === 'terbuka' ? 'Terbuka' : 'Wajib Hadir'}
                                    </span>
                                    {kegiatan.tipe === 'terbuka' && kegiatan.kuota && (
                                        <span className="flex items-center gap-1 text-xs text-neutral-500">
                                            <Users className="size-3" />
                                            Kuota: {kegiatan.kuota}
                                            {sisaKuota !== null && ` · Sisa: ${sisaKuota}`}
                                        </span>
                                    )}
                                </div>
                                {kegiatan.deskripsi && (
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {kegiatan.deskripsi}
                                    </p>
                                )}
                            </div>

                            {/* RSVP block */}
                            {!isPengurus && kegiatan.tipe === 'terbuka' && (
                                <div className="rounded-xl bg-indigo-50 p-4 dark:bg-indigo-900/20">
                                    <p className="mb-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                        Status RSVP Kamu
                                    </p>
                                    {rsvpStatus === 'terdaftar' ? (
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                <CheckCircle2 className="size-3.5" /> Terdaftar
                                            </span>
                                            <button
                                                onClick={handleBatalRsvp}
                                                disabled={rsvpLoading}
                                                className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
                                            >
                                                {rsvpLoading ? '...' : 'Batalkan'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleRsvp}
                                            disabled={rsvpLoading}
                                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {rsvpLoading ? <Loader2 className="size-4 animate-spin" /> : null}
                                            {rsvpLoading ? 'Memproses...' : 'RSVP Sekarang'}
                                        </button>
                                    )}
                                    {rsvpMsg && (
                                        <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-400">
                                            {rsvpMsg}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Jadwal Sesi */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                                    <Calendar className="size-3.5" /> Jadwal Sesi
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {kegiatan.sesi.map((sesi, idx) => (
                                        <div
                                            key={sesi.id}
                                            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700"
                                        >
                                            <div className="mb-3 flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                                                    Sesi {idx + 1} — {formatTanggal(sesi.tanggal)}
                                                </p>
                                                <span
                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_MAP[sesi.status].cls}`}
                                                >
                                                    {STATUS_MAP[sesi.status].label}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-1.5 text-xs text-neutral-500">
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="size-3.5 shrink-0" />
                                                    {sesi.waktu_mulai.slice(0, 5)} – {sesi.waktu_selesai.slice(0, 5)}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 shrink-0" />
                                                    {sesi.lokasi}
                                                </span>
                                            </div>

                                            {sesi.status === 'berlangsung' && (
                                                <a
                                                    href={`/${teamSlug}/presensi/${sesi.kode_presensi}`}
                                                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                                                >
                                                    <CheckCircle2 className="size-3.5" />
                                                    Isi Presensi
                                                </a>
                                            )}

                                            {sesi.rundown.length > 0 && (
                                                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-700">
                                                    <p className="mb-2 flex items-center gap-1 text-xs font-medium text-neutral-500">
                                                        <ClipboardList className="size-3" /> Rundown
                                                    </p>
                                                    <ul className="flex flex-col gap-1.5">
                                                        {[...sesi.rundown]
                                                            .sort((a, b) => a.urutan - b.urutan)
                                                            .map((r) => (
                                                                <li
                                                                    key={r.id}
                                                                    className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400"
                                                                >
                                                                    <span className="w-10 shrink-0 font-mono text-neutral-400">
                                                                        {r.waktu.slice(0, 5)}
                                                                    </span>
                                                                    <span>{r.uraian_acara}</span>
                                                                </li>
                                                            ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divisi Panitia & progres tugas */}
                            {kegiatan.divisi_panitia.length > 0 && (
                                <div>
                                    <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                                        <Users className="size-3.5" /> Panitia
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {kegiatan.divisi_panitia.map((divisi) => {
                                            const total = divisi.tugas_panitia.length;
                                            const selesai = divisi.tugas_panitia.filter(
                                                (t) => t.status === 'selesai',
                                            ).length;
                                            const pct = total > 0 ? Math.round((selesai / total) * 100) : 0;

                                            return (
                                                <div
                                                    key={divisi.id}
                                                    className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                                                >
                                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                                                            {divisi.nama_divisi}
                                                        </span>
                                                        {total > 0 && (
                                                            <span className="text-xs text-neutral-400">
                                                                {selesai}/{total} selesai
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Progress bar */}
                                                    {total > 0 && (
                                                        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                            <div
                                                                className="h-full rounded-full bg-green-500 transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Daftar tugas */}
                                                    {divisi.tugas_panitia.length > 0 && (
                                                        <ul className="flex flex-col gap-1">
                                                            {divisi.tugas_panitia.map((tugas) => (
                                                                <li
                                                                    key={tugas.id}
                                                                    className="flex items-start justify-between gap-2 text-xs"
                                                                >
                                                                    <span className="text-neutral-600 dark:text-neutral-400">
                                                                        {tugas.deskripsi_tugas}
                                                                        {tugas.user && (
                                                                            <span className="ml-1 text-neutral-400">
                                                                                ({tugas.user.name})
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span
                                                                        className={`shrink-0 rounded-full px-1.5 py-0.5 font-medium ${TUGAS_STATUS_CLS[tugas.status]}`}
                                                                    >
                                                                        {tugas.status}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    {total === 0 && (
                                                        <p className="text-xs text-neutral-400 italic">
                                                            Belum ada tugas.
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
