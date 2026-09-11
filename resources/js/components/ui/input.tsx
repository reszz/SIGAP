import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-[rgba(30,36,48,0.12)] bg-surface px-3 py-1 text-sm text-[#1E2430] placeholder:text-[#727C8E] transition-all duration-150 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[rgba(255,255,255,0.12)] dark:bg-[#181E2B] dark:text-[#E6ECF5] dark:placeholder:text-[#8C97A8]",
        "focus-visible:border-[#4A5FD1] focus-visible:ring-2 focus-visible:ring-[#4A5FD1]/20",
        "aria-invalid:border-[#C4514A] aria-invalid:ring-2 aria-invalid:ring-[#C4514A]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
