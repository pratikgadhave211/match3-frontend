import { useEffect, useMemo, useState } from "react";

interface RotatingTextProps {
  texts: string[];
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last";
  transition?: Record<string, unknown>;
}

export default function RotatingText({
  texts,
  mainClassName,
  splitLevelClassName,
  elementLevelClassName,
  rotationInterval = 2500
}: RotatingTextProps) {
  const safeTexts = useMemo(() => (texts.length > 0 ? texts : [""]), [texts]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % safeTexts.length);
    }, rotationInterval);

    return () => window.clearInterval(id);
  }, [rotationInterval, safeTexts.length]);

  return (
    <span className={mainClassName}>
      <span className={splitLevelClassName}>
        <span className={elementLevelClassName}>{safeTexts[index]}</span>
      </span>
    </span>
  );
}
