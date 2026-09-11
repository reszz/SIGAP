import { Sparkles } from 'lucide-react';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="flex size-7.5 shrink-0 items-center justify-center rounded-md bg-[#4A5FD1] text-white">
                <Sparkles className="size-4 fill-current" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#1E2430] dark:text-[#E6ECF5]">
                SIGAP
            </span>
        </div>
    );
}
