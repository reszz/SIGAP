import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import EventDetailCard from '@/components/event-detail-card';

export default function KalenderIndex() {
    const { currentTeam } = usePage().props;
    const teamSlug = currentTeam?.slug ?? '';

    const [selectedKegiatanId, setSelectedKegiatanId] = useState<number | null>(null);

    return (
        <>
            <Head title="Kalender Kegiatan" />

            <div className="flex h-full flex-col gap-0 p-4">
                <div className="mb-4">
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        Kalender Kegiatan
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-500">
                        Klik pada event untuk melihat detail, jadwal sesi, dan presensi.
                    </p>
                </div>

                <div className="flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 dark:border-sidebar-border dark:bg-neutral-900 [&_.fc]:h-full [&_.fc-theme-standard_.fc-scrollgrid]:border-neutral-200 [&_.fc-theme-standard_td]:border-neutral-100 [&_.fc-theme-standard_th]:border-neutral-100 dark:[&_.fc-theme-standard_.fc-scrollgrid]:border-neutral-700 dark:[&_.fc-theme-standard_td]:border-neutral-800 dark:[&_.fc-theme-standard_th]:border-neutral-800">
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
                            // Hover highlight untuk sesi dengan groupId sama (multi-hari)
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
