import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="sigap-auth-shell relative grid min-h-screen flex-col items-center justify-center bg-background px-4 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Brand Side Panel */}
            <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-linear-to-br from-[#4F46E5] via-[#3730A3] to-[#0F172A] p-12 text-white lg:flex">
                {/* Subtle decorative blurred circles */}
                <div className="pointer-events-none absolute -top-12 -left-12 size-64 rounded-full bg-[#10B981]/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 -bottom-16 size-80 rounded-full bg-[#4F46E5]/30 blur-3xl" />

                <Link
                    href={home()}
                    className="relative z-20 flex items-center gap-3 text-xl font-bold tracking-tight text-white"
                >
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-white/15 shadow-sm backdrop-blur-md">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </div>
                    <span className="font-display text-2xl font-bold">
                        SIGAP
                    </span>
                </Link>

                <div className="relative z-20 my-auto flex max-w-md flex-col gap-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                        <span className="size-2 rounded-full bg-[#10B981]" />
                        Platform Kegiatan Organisasi Mahasiswa
                    </span>
                    <h2 className="font-display text-3xl leading-tight font-extrabold text-white sm:text-4xl">
                        Satu tempat untuk seluruh kegiatan kampus.
                    </h2>
                    <p className="text-sm leading-relaxed font-medium text-white/80">
                        Jadwal & rundown, panitia, RSVP, presensi digital,
                        hingga laporan pertanggungjawaban — semua terpusat dan
                        rapi.
                    </p>
                </div>

                <div className="relative z-20 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-white/60">
                    <span>SIGAP &copy; {new Date().getFullYear()}</span>
                    <span>Sistem Informasi Kegiatan & Absensi</span>
                </div>
            </div>

            {/* Form side */}
            <div className="w-full p-6 lg:p-12">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-95">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 lg:hidden"
                    >
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#4F46E5] text-white shadow-xs">
                            <AppLogoIcon className="size-6 fill-current text-white" />
                        </div>
                        <span className="font-display text-2xl font-bold text-foreground">
                            SIGAP
                        </span>
                    </Link>

                    <div className="flex flex-col items-start gap-1.5 text-left sm:items-center sm:text-center">
                        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
