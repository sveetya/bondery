import type { HTMLAttributes } from "react";
import {
  BRAND_FONT_FAMILY,
  BRAND_LOGOTYPE_FONT_WEIGHT,
} from "#typography.js";
import { BonderyIcon } from "#react/BonderyIcon.js";
import { BonderyIconWhite } from "#react/BonderyIconWhite.js";

export type BonderyDynamicLogotypeProps = {
  /** Full label text (e.g. `"Bondery Docs"`). */
  text: string;
  /** Color scheme for icon and label. */
  theme: "light" | "dark";
  /** Icon height in pixels. Label font size scales with this. */
  height?: number;
} & Pick<HTMLAttributes<HTMLSpanElement>, "className" | "aria-label">;

const TEXT_COLORS = {
  light: "#18181b",
  dark: "#fafafa",
} as const;

/**
 * Bondery mark with a single styled label (icon + one text string).
 */
export function BonderyDynamicLogotype({
  text,
  theme,
  height = 20,
  className,
  "aria-label": ariaLabel,
}: BonderyDynamicLogotypeProps) {
  const iconSize = height;
  const fontSize = Math.round(height * 0.7);
  const color = TEXT_COLORS[theme];
  const Icon = theme === "dark" ? BonderyIconWhite : BonderyIcon;

  return (
    <span
      aria-label={ariaLabel ?? text}
      className={["inline-flex items-center gap-1.5", className].filter(Boolean).join(" ")}
      style={{ color }}
    >
      <Icon aria-hidden height={iconSize} width={iconSize} />
      <span
        className="leading-none"
        style={{
          fontFamily: BRAND_FONT_FAMILY,
          fontSize,
          fontWeight: BRAND_LOGOTYPE_FONT_WEIGHT,
        }}
      >
        {text}
      </span>
    </span>
  );
}
