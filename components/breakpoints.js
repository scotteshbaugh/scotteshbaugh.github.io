// Shared responsive breakpoints -- GENERATED FILE, do not hand-edit.
//
// Source of truth: the "Breakpoints" variables in Figma's Size collection.
// Named for size ranges (Material's window size classes, plus Spacious);
// each number is where that range STARTS, and a range ends where the next
// one starts:
//
//   Compact   0 - 719px
//   Medium    720 - 959px
//   Expanded  960 - 1599px
//   Spacious  1600px and up
//
// Regenerate the same way as tokens.json/css/tokens.css:
//   1. Change values in Figma.
//   2. Export variables with the plugin, overwrite tokens/source/figma-variables.json.
//   3. Re-run `node tokens/build-tokens.js`.
//
// Why these numbers live in a JS file instead of being read from
// css/tokens.css's custom properties at runtime: native CSS can't put a
// custom property inside an @media condition. Every component that needs
// a breakpoint imports the numbers from here and interpolates them
// straight into its own <style> template literal at module-load time.
// Plain .css files can't import this, so they repeat the numbers by hand.

export const BREAKPOINTS = {
  compact: 0,
  medium: 720,
  expanded: 960,
  spacious: 1600,
};

// Ready-made condition strings. Compact needs none: it's the unqueried
// default.
export const QUERY_MEDIUM = `(min-width: ${BREAKPOINTS.medium}px)`;
export const QUERY_MEDIUM_ONLY = `(min-width: ${BREAKPOINTS.medium}px) and (max-width: ${BREAKPOINTS.expanded - 1}px)`;
export const QUERY_EXPANDED = `(min-width: ${BREAKPOINTS.expanded}px)`;
export const QUERY_SPACIOUS = `(min-width: ${BREAKPOINTS.spacious}px)`;
