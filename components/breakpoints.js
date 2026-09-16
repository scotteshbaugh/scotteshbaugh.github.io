// Shared responsive breakpoints -- GENERATED FILE, do not hand-edit.
//
// Source of truth: the "Device Breakpoints" variables in Figma's Size
// collection (Tablet/Desktop, each aliased to a Container primitive).
// Regenerate the same way as tokens.json/css/tokens.css:
//   1. Change values in Figma.
//   2. Export variables with the plugin, overwrite tokens/source/figma-variables.json.
//   3. Re-run `node tokens/build-tokens.js`.
//
// Why these numbers live in a JS file instead of being read from
// css/tokens.css's custom properties at runtime: native CSS can't put a
// custom property inside an @media condition. Every component that needs
// a breakpoint imports the numbers from here and interpolates them
// straight into its own <style> template literal at module-load time --
// the generated CSS is still plain, native @media queries; only the
// authoring step changes.
//
// This only works because these files load as ES modules (type="module")
// script tags, which is also what lets components import each other
// without the page needing to list every dependency's <script> tag by
// hand in the right order.

export const BREAKPOINTS = {
  tablet: 720,
  desktop: 960,
};

// Ready-made condition strings for the two shapes components actually
// need. Add more here (rather than in a component file) if a third shape
// comes up.
export const QUERY_DESKTOP = `(min-width: ${BREAKPOINTS.desktop}px)`;
export const QUERY_TABLET_ONLY = `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`;
