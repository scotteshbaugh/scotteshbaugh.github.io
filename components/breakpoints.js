// Shared responsive breakpoints — the site's real, durable device
// breakpoints (not arbitrary), found as the min/max-width bounds on
// Figma's own Desktop/Tablet/Mobile frames when building the case study
// card:
//   < 768px          Mobile
//   768px - 959px    Tablet
//   >= 960px         Desktop
// (Figma's Mobile frame itself doesn't go below 360px wide, but nothing
// in code branches on that -- it's just the smallest width anything was
// designed for.)
//
// One file, one source of truth. Every component that needs a breakpoint
// imports from here instead of hardcoding the numbers. Native CSS can't
// put a custom property inside an @media condition, but that's not a
// problem for this codebase specifically because each component builds
// its <style> block as a JS template literal (see any component's
// TEMPLATE constant) -- so the numbers below get interpolated straight
// into the @media text at module-load time, before that string ever
// becomes CSS. The generated CSS is still plain, native @media queries;
// only the authoring step changes.
//
// This only works because these files load as ES modules (type="module"
// script tags), which is also what lets components import each other
// without the page needing to list every dependency's <script> tag by
// hand in the right order.

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 960,
};

// Ready-made condition strings for the two shapes components actually
// need. Add more here (rather than in a component file) if a third shape
// comes up.
export const QUERY_DESKTOP = `(min-width: ${BREAKPOINTS.desktop}px)`;
export const QUERY_TABLET_ONLY = `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`;
