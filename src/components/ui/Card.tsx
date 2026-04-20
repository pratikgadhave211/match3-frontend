import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div className={["rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl", className].join(" ")}>
      {children}
    </div>
  );
}
