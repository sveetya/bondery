import { existsSync } from "node:fs";

/**
 * WSLg creates /tmp/.X11-unix/X0 but many shells never set $DISPLAY.
 * Chromium requires DISPLAY to be set explicitly.
 *
 * @returns {boolean} true when DISPLAY was inferred for WSLg
 */
export function ensureWslgDisplay() {
  if (process.platform !== "linux") {
    return false;
  }

  if (process.env.DISPLAY || process.env.WAYLAND_DISPLAY) {
    return false;
  }

  if (!existsSync("/tmp/.X11-unix/X0")) {
    return false;
  }

  process.env.DISPLAY = ":0";
  return true;
}
