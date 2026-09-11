import { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import PublicNavbar from '@/components/public-navbar';
import PublicFooter from '@/components/public-footer';

interface PublicLayoutProps {
    title?: string;
    description?: string;
}

export default function PublicLayout({
    title = 'SIGAP - Sistem Informasi Kegiatan, Absensi, dan Pelaporan',
    description = 'Platform terpadu tata kelola kegiatan, presensi real-time, dan kepanitiaan organisasi.',
    children,
}: PropsWithChildren<PublicLayoutProps>) {
    return (
        <>
            <Head>
                <title>{title}</title>
                <meta name="description" content={description} />
            </Head>

            <div className="sigap-public-shell min-h-screen bg-sigap-base text-sigap-ink antialiased selection:bg-sigap-blue/20 selection:text-sigap-blue dark:bg-[#0E121A] dark:text-[#E6ECF5]">
                <PublicNavbar />
                <main>{children}</main>
                <PublicFooter />
            </div>
        </>
    );
}
