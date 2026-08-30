import { useEffect, useState } from 'react';

/**
 * The three interaction models the builders adapt to.
 *
 * - `mobile`  (< 768px)  — one pane at a time, driven by a bottom mode switch.
 * - `tablet`  (768–1023) — editor + preview side by side, design in a drawer.
 * - `desktop` (>= 1024)  — the original three-panel grid, untouched.
 *
 * The 1024 boundary is deliberate: it is where the builder grid already
 * switches from stacked to multi-column (`lg:` in Tailwind), so nothing below
 * it ever saw the desktop layout to begin with.
 */
export type Viewport = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

const read = (): Viewport => {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w >= DESKTOP_MIN) return 'desktop';
  if (w >= TABLET_MIN) return 'tablet';
  return 'mobile';
};

/**
 * Current viewport bucket, updated on resize / orientation change.
 *
 * Uses `matchMedia` rather than a resize listener so it only fires when the
 * bucket actually changes, not on every pixel.
 */
export const useViewport = (): Viewport => {
  const [viewport, setViewport] = useState<Viewport>(read);

  useEffect(() => {
    const tablet = window.matchMedia(`(min-width: ${TABLET_MIN}px)`);
    const desktop = window.matchMedia(`(min-width: ${DESKTOP_MIN}px)`);
    const update = () => setViewport(read());

    update();
    tablet.addEventListener('change', update);
    desktop.addEventListener('change', update);
    return () => {
      tablet.removeEventListener('change', update);
      desktop.removeEventListener('change', update);
    };
  }, []);

  return viewport;
};
