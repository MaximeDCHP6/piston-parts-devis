"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { confirmMessage: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
      className={cn("text-sm text-danger hover:underline", className)}
      {...props}
    >
      {children}
    </button>
  );
}
