export type UserRole = 'super_admin' | 'pembina' | 'pengurus' | 'anggota';

export type User = {
    id: number;
    name: string;
    nim: string;
    email: string;
    role: UserRole;
    current_team_id?: number | null;
    current_periode_id?: number | null;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
