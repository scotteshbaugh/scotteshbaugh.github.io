#!/usr/bin/env node
/**
 * assets/icons/*.svg -> components/icon-registry.js
 *
 * Usage: node tokens/build-icons.js
 * Reads:  assets/icons/<name>.svg   (Feather, vendored -- see that folder's README)
 * Writes: components/icon-registry.js
 *
 * <ds-icon> needs the icons inlined rather than fetched: a request per icon
 * would cost a blank frame before each one paints. This turns the vendored
 * SVG files into one module so that inlining doesn't mean hand-copying
 * markup into a hardcoded map -- the files stay the single source, exactly
 * as tokens/source/figma-variables.json is for tokens.css.
 *
 * Only the markup *inside* each <svg> is kept. Every Feather file carries
 * the same wrapper attributes (viewBox, fill, stroke, linecap, linejoin),
 * so those live once in ds-icon's own template instead of 287 times here.
 *
 * Re-run this after changing anything in assets/icons/. Never hand-edit
 * components/icon-registry.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'assets', 'icons');
const OUT = path.join(ROOT, 'components', 'icon-registry.js');

function innerMarkup(svg) {
  const match = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg);
  if (!match) return null;
  return match[1].trim().replace(/\s*\n\s*/g, '');
}

function main() {
  const files = fs.readdirSync(ICONS_DIR).filter((f) => f.endsWith('.svg')).sort();

  const entries = [];
  const skipped = [];
  for (const file of files) {
    const name = path.basename(file, '.svg');
    const body = innerMarkup(fs.readFileSync(path.join(ICONS_DIR, file), 'utf8'));
    if (!body) {
      skipped.push(file);
      continue;
    }
    entries.push(`  ${JSON.stringify(name)}: ${JSON.stringify(body)},`);
  }

  const content = `// Icon markup for <ds-icon> — GENERATED FILE, do not hand-edit.
//
// Source of truth: the SVG files in assets/icons/ (Feather, vendored --
// see that folder's README for provenance and licence). Regenerate with:
//
//   node tokens/build-icons.js
//
// Each value is the markup from inside that icon's <svg>, with the wrapper
// attributes stripped: viewBox, fill, stroke, linecap and linejoin are
// identical across the whole set, so components/icon.js states them once in
// its own template rather than repeating them ${entries.length} times here.
//
// Inlined rather than fetched at runtime, because a request per icon means
// a blank frame before each one paints. The whole set is ~10KB over the
// wire once compressed, which is cheaper than being selective about it.

export const ICONS = {
${entries.join('\n')}
};

export const ICON_NAMES = Object.keys(ICONS);
`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, content);

  if (skipped.length) {
    console.warn(`Skipped (no <svg> found): ${skipped.join(', ')}`);
  }
  console.log(`wrote ${path.relative(ROOT, OUT)} (${entries.length} icons, ${(content.length / 1024).toFixed(1)} KB)`);
}

main();
