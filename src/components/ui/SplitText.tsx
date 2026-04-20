import { createElement } from "react";

interface SplitTextProps {
  text: string;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  textAlign?: "left" | "center" | "right";
  delay?: number;
  duration?: number;
  splitType?: "chars" | "words";
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
}

export default function SplitText({ text, tag = "p", className, textAlign = "left" }: SplitTextProps) {
  return createElement(tag, { className, style: { textAlign } }, text);
}
