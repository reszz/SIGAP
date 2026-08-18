import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import EventDetailCard from '@/components/event-detail-card';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';

export default function KalenderIndex() {
    const { currentTeam, auth } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';
    const isPengurus = auth.user.role === 'pengurus';

    const dashboardUrl = currentTeam
        ? isPengurus
            ? pengurusDashboard.url(currentTeam.slug)
            : anggotaDashboard.url(currentTeam.slug)
        : '/';

    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);

    return (
        <>
            <Head title="Kalender Kegiatan" />

            <div className="flex h-full flex-col gap-0">
                {/* ── Page header ── */}
                <div className="flex items-center gap-3 border-b border-sidebar-border/40 bg-background/80 px-5 py-4 backdrop-blur-sm">
                    <Link
                        href={dashboardUrl}
                        className="flex size-8 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        aria-label="Kembali ke dashboard"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
                    <CalendarDays className="size-5 text-indigo-500" />
                    <div>
                        <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            Kalender Kegiatan
                        </h1>
                        <p className="text-xs text-neutral-500">
                            Klik event untuk melihat detail, jadwal sesi, dan presensi.
                        </p>
                    </div>
                </div>

                {/* ── Calendar container ── */}
                <div className="flex-1 overflow-hidden p-4">
                    <div className="h-full overflow-hidden rounded-2xl border border-sidebar-border/70 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-900
                        [&_.fc]:h-full
                        [&_.fc-button]:rounded-lg! [&_.fc-button]:border-0! [&_.fc-button]:bg-indigo-600! [&_.fc-button]:px-3! [&_.fc-button]:py-1.5! [&_.fc-button]:text-sm! [&_.fc-button]:font-medium! [&_.fc-button]:text-white! [&_.fc-button]:shadow-sm! [&_.fc-button:hover]:bg-indigo-700! [&_.fc-button:focus]:shadow-none!
                        [&_.fc-button-active]:bg-indigo-800!
                        [&_.fc-toolbar-title]:text-lg! [&_.fc-toolbar-title]:font-bold! [&_.fc-toolbar-title]:text-neutral-800! dark:[&_.fc-toolbar-title]:text-neutral-100!
                        [&_.fc-col-header-cell-cushion]:py-2! [&_.fc-col-header-cell-cushion]:text-xs! [&_.fc-col-header-cell-cushion]:font-semibold! [&_.fc-col-header-cell-cushion]:uppercase! [&_.fc-col-header-cell-cushion]:tracking-wider! [&_.fc-col-header-cell-cushion]:text-neutral-500! dark:[&_.fc-col-header-cell-cushion]:text-neutral-400!
                        [&_.fc-daygrid-day-number]:text-sm! [&_.fc-daygrid-day-number]:text-neutral-700! dark:[&_.fc-daygrid-day-number]:text-neutral-300!
                        [&_.fc-day-today]:bg-indigo-50/60! dark:[&_.fc-day-today]:bg-indigo-950/20!
                        [&_.fc-event]:cursor-pointer! [&_.fc-event]:rounded-md! [&_.fc-event]:border-0! [&_.fc-event]:text-xs! [&_.fc-event]:font-medium! [&_.fc-event]:transition-opacity! [&_.fc-event:hover]:opacity-80!
                        [&_.fc-theme-standard_.fc-scrollgrid]:border-neutral-100! dark:[&_.fc-theme-standard_.fc-scrollgrid]:border-neutral-800!
                        [&_.fc-theme-standard_td]:border-neutral-100! dark:[&_.fc-theme-standard_td]:border-neutral-800!
                        [&_.fc-theme-standard_th]:border-neutral-100! dark:[&_.fc-theme-standard_th]:border-neutral-800!
                        [&_.fc-list-day-cushion]:bg-neutral-50! dark:[&_.fc-list-day-cushion]:bg-neutral-800/60!
                        [&_.fc-list-event:hover_td]:bg-indigo-50/50! dark:[&_.fc-list-event:hover_td]:bg-indigo-950/20!
                        p-4
                    ">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            locale="id"
                            buttonText={{ today: 'Hari ini', month: 'Bulan', week: 'Minggu', list: 'Agenda' }}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,listWeek',
                            }}
                            events={`/${teamSlug}/kalender/events`}
                            eventClick={(info) => {
                                const kegiatanId = info.event.extendedProps.kegiatanId as number;
                                setSelectedKegiatanId(kegiatanId);
                            }}
                            eventDidMount={(info) => {
                                const groupId = info.event.groupId;
                                if (!groupId) return;

                                info.el.addEventListener('mouseenter', () => {
                                    document.querySelectorAll(`[data-group-id="${groupId}"]`).forEach(el => {
                                        el.classList.add('ring-2', 'ring-offset-1', 'ring-white/50');
                                    });
                                });
                                info.el.addEventListener('mouseleave', () => {
                                    document.querySelectorAll(`[data-group-id="${groupId}"]`).forEach(el => {
                                        el.classList.remove('ring-2', 'ring-offset-1', 'ring-white/50');
                                    });
                                });
                                info.el.dataset.groupId = groupId;
                            }}
                            eventDisplay="block"
                            height="100%"
                            dayMaxEvents={3}
                        />
                    </div>
                </div>
            </div>

            {/* Event Detail Card (slide-in) */}
            {selectedKegiatanId && (
                <EventDetailCard
                    kegiatanId={selectedKegiatanId}
                    onClose={() => setSelectedKegiatanId(null)}
                />
            )}
        </>
    );
}
