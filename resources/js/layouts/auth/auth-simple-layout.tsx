import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="sigap-auth-shell flex min-h-svh flex-col items-center justify-center gap-6 bg-[#F6F7F9] p-6 md:p-10 dark:bg-[#0E121A]">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-3">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-[#4A5FD1] text-white shadow-xs">
                                <AppLogoIcon className="size-5 fill-current text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1 text-center">
                            <h1 className="font-display text-xl font-semibold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                                {title}
                            </h1>
                            <p className="text-center text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white p-6 shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
