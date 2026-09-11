import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Head, usePage } from '@inertiajs/react';
import {  CalendarDays } from 'lucide-react';
import { useState } from 'react';
import EventDetailCard from '@/components/event-detail-card';
import { dashboard as anggotaDashboard } from '@/routes/anggota';
import { events as kalenderEvents } from '@/routes/kalender';
import { dashboard as pengurusDashboard } from '@/routes/pengurus';

export default function KalenderIndex() {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);

    return (
        <>
            <Head title="Kalender Kegiatan" />

            <div className="flex h-full flex-col gap-0">
                {/* ── Page header ── */}
                <div className="flex items-center gap-3 border-b border-[rgba(30,36,48,0.08)] bg-white px-5 py-3.5 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                    <div className="h-5 w-px bg-[rgba(30,36,48,0.08)] dark:bg-[rgba(255,255,255,0.08)]" />
                    <div className="flex size-7.5 items-center justify-center rounded-md bg-[#4A5FD1]/12 text-[#4A5FD1] dark:bg-[#4A5FD1]/20 dark:text-[#8FA0FA]">
                        <CalendarDays className="size-4" />
                    </div>
                    <div>
                        <h1 className="font-display text-sm font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                            Kalender Kegiatan
                        </h1>
                        <p className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                            Klik event untuk melihat detail kegiatan, jadwal sesi, dan status presensi.
                        </p>
                    </div>
                </div>

                {/* ── Calendar container ── */}
                <div className="flex-1 overflow-hidden p-4">
                    <div className="h-full overflow-hidden rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-4 dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]
                        [&_.fc]:h-full
                        [&_.fc-button]:rounded-md! [&_.fc-button]:border-0! [&_.fc-button]:bg-[#4A5FD1]! [&_.fc-button]:px-3! [&_.fc-button]:py-1.5! [&_.fc-button]:text-xs! [&_.fc-button]:font-semibold! [&_.fc-button]:text-white! [&_.fc-button]:shadow-none! [&_.fc-button:hover]:bg-[#3B4DB8]! [&_.fc-button:focus]:shadow-none!
                        [&_.fc-button-active]:bg-[#3B4DB8]!
                        [&_.fc-toolbar-title]:font-display! [&_.fc-toolbar-title]:text-base! [&_.fc-toolbar-title]:font-semibold! [&_.fc-toolbar-title]:text-[#1E2430]! dark:[&_.fc-toolbar-title]:text-[#E6ECF5]!
                        [&_.fc-col-header-cell-cushion]:py-2! [&_.fc-col-header-cell-cushion]:text-[11px]! [&_.fc-col-header-cell-cushion]:font-semibold! [&_.fc-col-header-cell-cushion]:uppercase! [&_.fc-col-header-cell-cushion]:tracking-wider! [&_.fc-col-header-cell-cushion]:text-[#727C8E]! dark:[&_.fc-col-header-cell-cushion]:text-[#8C97A8]!
                        [&_.fc-daygrid-day-number]:font-mono-sigap! [&_.fc-daygrid-day-number]:text-xs! [&_.fc-daygrid-day-number]:font-medium! [&_.fc-daygrid-day-number]:text-[#1E2430]! dark:[&_.fc-daygrid-day-number]:text-[#E6ECF5]!
                        [&_.fc-day-today]:bg-[#4A5FD1]/6! dark:[&_.fc-day-today]:bg-[#4A5FD1]/15!
                        [&_.fc-event]:cursor-pointer! [&_.fc-event]:rounded-md! [&_.fc-event]:border-0! [&_.fc-event]:text-xs! [&_.fc-event]:font-medium! [&_.fc-event]:transition-opacity! [&_.fc-event:hover]:opacity-85!
                        [&_.fc-theme-standard_.fc-scrollgrid]:border-[rgba(30,36,48,0.06)]! dark:[&_.fc-theme-standard_.fc-scrollgrid]:border-[rgba(255,255,255,0.06)]!
                        [&_.fc-theme-standard_td]:border-[rgba(30,36,48,0.06)]! dark:[&_.fc-theme-standard_td]:border-[rgba(255,255,255,0.06)]!
                        [&_.fc-theme-standard_th]:border-[rgba(30,36,48,0.06)]! dark:[&_.fc-theme-standard_th]:border-[rgba(255,255,255,0.06)]!
                        [&_.fc-list-day-cushion]:bg-[#F6F7F9]! dark:[&_.fc-list-day-cushion]:bg-[#21293A]!
                        [&_.fc-list-event:hover_td]:bg-[#4A5FD1]/8! dark:[&_.fc-list-event:hover_td]:bg-[#4A5FD1]/15!
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
                            events={teamSlug ? kalenderEvents.url(teamSlug) : undefined}
                            eventClick={(info) => {
                                const kegiatanId = info.event.extendedProps.kegiatanId as number;
                                setSelectedKegiatanId(kegiatanId);
                            }}
                            eventDidMount={(info) => {
                                const groupId = info.event.groupId;
                                if (!groupId) return;

                                info.el.addEventListener('mouseenter', () => {
                                    document.querySelectorAll(`[data-group-id="${groupId}"]`).forEach(el => {
                                        el.classList.add('ring-2', 'ring-offset-1', 'ring-[#4A5FD1]');
                                    });
                                });
                                info.el.addEventListener('mouseleave', () => {
                                    document.querySelectorAll(`[data-group-id="${groupId}"]`).forEach(el => {
                                        el.classList.remove('ring-2', 'ring-offset-1', 'ring-[#4A5FD1]');
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
KalenderIndex.layout = (props: {
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
        {
            title: 'Kalender Kegiatan',
            href: '#',
        },
    ],
});
