import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

export default function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? "bg-primary text-on-primary border border-primary/40"
      : "bg-white/10 text-white border border-white/30";

  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded-xl font-headline font-bold transition-all duration-200",
        "hover:-translate-y-0.5",
        variantClass,
        className
      ].join(" ")}
    >
      {children}
    </button>
  );
}
