import type { ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  spotlightColor?: string;
}

export default function SpotlightCard({ children, spotlightColor = "rgba(176, 127, 241, 0.2)" }: SpotlightCardProps) {
  return (
    <div className="spotlight-card" style={{ boxShadow: `0 18px 50px ${spotlightColor}` }}>
      {children}
    </div>
  );
}
