import type { Auth } from '@/types/auth';
import type { Team } from '@/types/teams';
import type { Periode } from '@/types/periode';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            currentTeam: Team | null;
            teams: Team[];
            currentPeriode: Periode | null;
            periodes: Periode[];
            [key: string]: unknown;
        };
    }
}

