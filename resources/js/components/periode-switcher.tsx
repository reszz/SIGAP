import { router, usePage } from '@inertiajs/react';
import { CalendarDays, Check, ChevronsUpDown, Plus } from 'lucide-react';
import CreatePeriodeModal from '@/components/create-periode-modal';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Periode } from '@/types/periode';

type PeriodeSwitcherProps = {
    inHeader?: boolean;
};

export function PeriodeSwitcher({ inHeader = false }: PeriodeSwitcherProps) {
    const page = usePage();
    const isMobile = useIsMobile();
    const currentTeam = page.props.currentTeam;
    const currentPeriode = page.props.currentPeriode;
    const periodes = page.props.periodes ?? [];
    const authUser = page.props.auth?.user;

    const canCreatePeriode =
        authUser?.role === 'super_admin' || authUser?.role === 'pembina';

    const switchPeriode = (periode: Periode) => {
        if (!currentTeam || currentPeriode?.id === periode.id) return;

        router.patch(
            `/${currentTeam.slug}/switch-periode/${periode.id}`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload();
                },
            }
        );
    };

    if (!currentTeam) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    data-test="periode-switcher-trigger"
                    className={
                        inHeader
                            ? 'h-8 gap-1.5 px-2 rounded-md border border-border/50 text-xs font-normal'
                            : 'w-full justify-start px-2 rounded-md has-[>svg]:px-2 text-[#1E2430] hover:bg-[#F0F2F5] dark:text-[#E6ECF5] dark:hover:bg-[#21293A] data-[state=open]:bg-[#4A5FD1]/10 data-[state=open]:text-[#4A5FD1]'
                    }
                >
                    <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                    <div
                        className={
                            inHeader
                                ? 'grid flex-1 text-left text-xs leading-tight'
                                : 'grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden'
                        }
                    >
                        <span className="truncate font-medium flex items-center gap-1.5">
                            {currentPeriode ? (
                                <>
                                    <span>{currentPeriode.nama}</span>
                                    {currentPeriode.is_aktif && (
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-semibold">
                                            Aktif
                                        </span>
                                    )}
                                </>
                            ) : (
                                'Pilih Periode'
                            )}
                        </span>
                    </div>
                    <ChevronsUpDown
                        className={
                            inHeader
                                ? 'size-3.5 opacity-50'
                                : 'ml-auto size-4 group-data-[collapsible=icon]:hidden'
                        }
                    />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className={
                    inHeader
                        ? 'w-64'
                        : 'w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg'
                }
                side={inHeader ? undefined : isMobile ? 'bottom' : 'right'}
                align={inHeader ? 'end' : 'start'}
                sideOffset={inHeader ? undefined : 4}
            >
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>Periode Kepengurusan</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                        {periodes.length} Periode
                    </span>
                </DropdownMenuLabel>
                {periodes.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                        Belum ada periode
                    </div>
                ) : (
                    periodes.map((periode) => {
                        const isSelected = currentPeriode?.id === periode.id;
                        const isPast = !periode.is_aktif && !periode.is_latest;

                        return (
                            <DropdownMenuItem
                                key={periode.id}
                                className="cursor-pointer gap-2 p-2"
                                onSelect={() => switchPeriode(periode)}
                            >
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-1.5 font-medium text-sm">
                                        <span>{periode.nama}</span>
                                        {periode.is_aktif && (
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 rounded font-semibold">
                                                Aktif
                                            </span>
                                        )}
                                        {isPast && (
                                            <span className="text-[10px] bg-muted text-muted-foreground px-1 py-0.2 rounded font-normal">
                                                Arsip
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground">
                                        {periode.tanggal_mulai} s/d {periode.tanggal_selesai}
                                    </span>
                                </div>
                                {isSelected && (
                                    <Check className="ml-auto size-4 text-primary" />
                                )}
                            </DropdownMenuItem>
                        );
                    })
                )}

                {canCreatePeriode && (
                    <>
                        <DropdownMenuSeparator />
                        <CreatePeriodeModal>
                            <DropdownMenuItem
                                className="cursor-pointer gap-2 p-2"
                                onSelect={(e) => e.preventDefault()}
                            >
                                <Plus className="size-4 text-primary" />
                                <span className="font-medium text-sm">Buat Periode Baru</span>
                            </DropdownMenuItem>
                        </CreatePeriodeModal>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
