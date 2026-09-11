import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="sigap-auth-shell flex min-h-svh flex-col items-center justify-center gap-6 bg-[#F6F7F9] p-6 md:p-10 dark:bg-[#0E121A]">
            <div className="flex w-full max-w-md flex-col gap-6">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium"
                >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#4A5FD1] text-white shadow-xs">
                        <AppLogoIcon className="size-5 fill-current text-white" />
                    </div>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-lg border border-[rgba(30,36,48,0.08)] bg-white shadow-sm dark:border-[rgba(255,255,255,0.08)] dark:bg-[#181E2B]">
                        <CardHeader className="px-8 pt-7 pb-0 text-center">
                            <CardTitle className="font-display text-xl font-semibold text-[#1E2430] dark:text-[#E6ECF5]">
                                {title}
                            </CardTitle>
                            <CardDescription className="text-xs text-[#727C8E] dark:text-[#8C97A8]">
                                {description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-8 py-6">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
