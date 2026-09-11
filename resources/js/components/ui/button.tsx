import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[#4A5FD1] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#4A5FD1] text-white hover:bg-[#3B4DB8] active:bg-[#3242A3] dark:bg-[#586DE6] dark:hover:bg-[#4A5FD1]",
        destructive:
          "bg-[#C4514A] text-white hover:bg-[#AF4039] focus-visible:ring-[#C4514A] dark:bg-[#D9615A] dark:hover:bg-[#C4514A]",
        outline:
          "border border-[rgba(30,36,48,0.12)] bg-surface text-[#1E2430] hover:bg-[#F6F7F9] dark:border-[rgba(255,255,255,0.1)] dark:bg-transparent dark:text-[#E6ECF5] dark:hover:bg-[#21293A]",
        secondary:
          "bg-[#F0F2F5] text-[#1E2430] hover:bg-[#E5E8ED] dark:bg-[#21293A] dark:text-[#E6ECF5] dark:hover:bg-[#2B344A]",
        ghost:
          "text-[#1E2430] hover:bg-[rgba(30,36,48,0.05)] dark:text-[#E6ECF5] dark:hover:bg-[rgba(255,255,255,0.06)]",
        link: "text-[#4A5FD1] underline-offset-4 hover:underline dark:text-[#8FA0FA]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4 text-base",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
