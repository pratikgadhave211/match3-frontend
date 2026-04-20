import type { CSSProperties } from "react";

interface TiltedIconCardProps {
  icon: string;
  title: string;
  description: string;
  containerHeight?: string;
  containerWidth?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  showMobileWarning?: boolean;
}

export default function TiltedIconCard({
  icon,
  title,
  description,
  containerHeight = "280px",
  containerWidth = "100%",
  rotateAmplitude = 12,
  scaleOnHover = 1.05
}: TiltedIconCardProps) {
  const style = {
    height: containerHeight,
    width: containerWidth,
    ["--rotate-amplitude" as string]: `${rotateAmplitude}deg`,
    ["--scale-on-hover" as string]: String(scaleOnHover)
  } as CSSProperties;

  return (
    <article className="tilted-icon-card" style={style}>
      <div className="tilted-icon-card__icon-wrap">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <h3 className="tilted-icon-card__title">{title}</h3>
      <p className="tilted-icon-card__description">{description}</p>
    </article>
  );
}
