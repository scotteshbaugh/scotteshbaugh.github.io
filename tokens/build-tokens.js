#!/usr/bin/env node
/**
 * Figma Variables -> DTCG tokens -> CSS custom properties
 *
 * Usage: node tokens/build-tokens.js
 * Reads:  tokens/source/figma-variables.json  (raw export from the Figma variables plugin)
 * Writes: tokens/tokens.json                  (DTCG-format design tokens)
 *         css/tokens.css                      (CSS custom properties, Light mode only)
 *         components/breakpoints.js           (JS breakpoint numbers -- see note below)
 *
 * How to update your tokens:
 *   1. Change values in Figma.
 *   2. Export variables with the plugin, overwrite tokens/source/figma-variables.json.
 *   3. Re-run this script. Never hand-edit tokens.json, css/tokens.css, or
 *      components/breakpoints.js directly.
 *
 * Why components/breakpoints.js is generated too: native CSS can't put a
 * custom property inside an @media condition, so components that need a
 * breakpoint import plain JS numbers from that file instead of reading
 * css/tokens.css at runtime. Those numbers come from the "Device
 * Breakpoints" variables (Size collection) -- resolveNumericValue() below
 * follows their alias chain back to a real number (e.g. Tablet -> Size
 * Primitives/Container/900 -> 720) since the CSS output only needs a
 * var() reference, but a JS breakpoint constant needs the literal number.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(__dirname, 'source', 'figma-variables.json');
const TOKENS_OUT = path.join(__dirname, 'tokens.json');
const CSS_OUT = path.join(ROOT, 'css', 'tokens.css');
const BREAKPOINTS_OUT = path.join(ROOT, 'components', 'breakpoints.js');

// Which Figma variable collection maps to which DTCG group path.
// Add an entry here whenever a new collection (Size, Typography, etc.) gets exported.
const COLLECTION_GROUP_MAP = {
  'Color Primitives': ['color', 'primitive'],
  'Color': ['color'],
  'Size Primitives': ['size', 'primitive'],
  // "Layer" maps to root (an empty path) rather than a "layer" group of its
  // own, because its variables already carry the group name Figma shows them
  // under -- "Elevation/400/Shadow 1/Blur", "Overlay/Scrim/Blur" -- so the
  // Figma group becomes the top-level token path on its own: elevation.*,
  // overlay.*. This collection used to BE named "Elevation" with variables
  // like "400/Shadow 1/Blur"; when it was renamed and the elevations were
  // nested under an Elevation group, the default fallback here would have
  // produced layer.elevation.* instead, which (a) renames every
  // --elevation-* custom property out from under the components using them
  // and (b) hides the elevations from composeShadowTokens(), which looks
  // for tokensRoot.elevation -- silently emitting 60 flat shadow-field vars
  // and no composed box-shadow at all. Mapping to root keeps both working.
  'Layer': [],
};

// Which mode is the "real" value for now (no dark mode wired up in CSS yet).
const DEFAULT_MODE = 'SDS Light';

const TYPE_MAP = { COLOR: 'color', FLOAT: 'number', STRING: 'string', BOOLEAN: 'boolean' };

function kebab(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function groupPathFor(collectionName) {
  return COLLECTION_GROUP_MAP[collectionName] || [kebab(collectionName)];
}

function tokenPathFor(collectionName, variableName) {
  return groupPathFor(collectionName).concat(variableName.split('/').map(kebab));
}

function toHexByte(n) {
  return Math.round(n).toString(16).padStart(2, '0');
}

// Figma stores numbers as 32-bit floats, so a value typed as 1.6 comes back
// as 1.600000023841858 and lands in the CSS that way. That is float noise,
// not intent -- nobody typed those digits -- so numbers are snapped back to
// what a person would have entered. Five decimal places is far finer than
// any real design value and comfortably inside the error.
function cleanNumber(n) {
  if (typeof n !== 'number' || !isFinite(n)) return n;
  return Math.round(n * 1e5) / 1e5;
}

function colorToHex(colorValue) {
  const { rgba } = colorValue;
  const hex = '#' + [rgba.r, rgba.g, rgba.b].map(toHexByte).join('');
  if (rgba.a >= 1) return hex;
  return hex + toHexByte(rgba.a * 255);
}

function setDeep(root, pathArr, tokenObj) {
  let node = root;
  for (let i = 0; i < pathArr.length - 1; i++) {
    const key = pathArr[i];
    node[key] = node[key] || {};
    node = node[key];
  }
  node[pathArr[pathArr.length - 1]] = tokenObj;
}

// Turns a DTCG token value into the string that goes on the right-hand side of
// a CSS custom property: `{some.ref}` -> `var(--some-ref)`, everything else
// passes through unchanged (isPxDimension handles bare-number unit suffixing
// elsewhere, before this ever runs on a shadow's sub-fields).
function refToVar(value) {
  if (typeof value === 'string') {
    const refMatch = /^\{(.+)\}$/.exec(value);
    if (refMatch) return `var(--${refMatch[1].split('.').join('-')})`;
  }
  return value;
}

// Elevation levels come in from Figma as either a flat set of fields
// (100, 600 -- one shadow) or a set of "Shadow 1" / "Shadow 2" sub-groups
// (200-500 -- layered shadows). Either way every field is its own DTCG leaf
// token by the time the main loop is done with it. This folds those leaves
// into one real `$type: "shadow"` token per level -- DTCG's shadow value is
// a single {color, offsetX, offsetY, blur, spread} object, or an array of
// those for a layered shadow -- instead of leaving 5 (or 10) flat siblings
// that need hand-assembling into `box-shadow:` every time they're used.
function buildShadowValue(fields) {
  return {
    color: fields['color'].$value,
    offsetX: fields['position-x'].$value,
    offsetY: fields['position-y'].$value,
    blur: fields['blur'].$value,
    spread: fields['spread'].$value,
  };
}

// Every shadow group (Elevation, Separation) follows the same system: Figma
// stores each level as loose fields, and this folds them into one composed
// `$type: "shadow"` token per level, so CSS gets --elevation-300 and
// --separation-200 the same way. Add a new shadow group to SHADOW_GROUPS
// and it composes too -- nothing else changes.
const SHADOW_GROUPS = ['elevation', 'separation'];

function composeShadowTokens(tokensRoot, groupName) {
  const elevationRoot = tokensRoot[groupName];
  if (!elevationRoot) return;

  for (const level of Object.keys(elevationRoot)) {
    const node = elevationRoot[level];

    // Flat: this level's own fields are the shadow (100, 600).
    if (node['position-x']) {
      elevationRoot[level] = { $type: 'shadow', $value: buildShadowValue(node) };
      continue;
    }

    // Layered: "shadow-1", "shadow-2", ... sub-groups, in numeric order.
    const shadowKeys = Object.keys(node)
      .filter((k) => /^shadow-\d+$/.test(k))
      .sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));

    if (shadowKeys.length) {
      const shadows = shadowKeys.map((k) => buildShadowValue(node[k]));
      elevationRoot[level] = { $type: 'shadow', $value: shadows };
    }
  }
}

// Radial gradients follow the same system as shadows: Figma holds every
// decision as its own variable (both colors, both stop positions, plus the
// Shape / Size / Position strings Figma can't bind but records anyway), and
// this folds them into one `$type: "gradient"` token that replaces the group.
// Background/Media/Showcase/* becomes --color-background-media-showcase.
// Any group containing these seven leaves composes -- nothing is named here.
const GRADIENT_FIELDS = ['radial-inner', 'inner-stop', 'radial-outer', 'outer-stop', 'shape', 'size', 'position'];

function composeGradientTokens(node) {
  if (!node || typeof node !== 'object' || '$value' in node) return;
  for (const key of Object.keys(node)) {
    const child = node[key];
    if (child && typeof child === 'object' && !('$value' in child) &&
        GRADIENT_FIELDS.every((f) => child[f] && '$value' in child[f])) {
      node[key] = {
        $type: 'gradient',
        $value: {
          shape: child['shape'].$value,
          size: child['size'].$value,
          position: child['position'].$value,
          stops: [
            { color: child['radial-inner'].$value, position: child['inner-stop'].$value },
            { color: child['radial-outer'].$value, position: child['outer-stop'].$value },
          ],
        },
      };
    } else {
      composeGradientTokens(child);
    }
  }
}

// Follows a dotted token path (e.g. "size.device-breakpoints.tablet") down
// into tokensRoot and returns its final resolved number -- chasing through
// any "{other.path}" alias references along the way. Returns undefined if
// the path doesn't exist or never bottoms out in a number (e.g. it's still
// missing from this Figma export).
function resolveNumericValue(tokensRoot, dottedPath) {
  let node = tokensRoot;
  for (const part of dottedPath.split('.')) {
    if (!node || typeof node !== 'object') return undefined;
    node = node[part];
  }
  if (!node || typeof node.$value === 'undefined') return undefined;
  const value = node.$value;
  if (typeof value === 'string') {
    const refMatch = /^\{(.+)\}$/.exec(value);
    if (refMatch) return resolveNumericValue(tokensRoot, refMatch[1]);
    return undefined;
  }
  return typeof value === 'number' ? value : undefined;
}

// Regenerates components/breakpoints.js from the resolved Device
// Breakpoints tokens, in the same shape components already import
// (BREAKPOINTS, QUERY_DESKTOP, QUERY_TABLET_ONLY). Skips (with a warning)
// rather than writing a broken file if either breakpoint isn't in this
// Figma export yet.
function writeBreakpointsFile(tokensRoot) {
  const tablet = resolveNumericValue(tokensRoot, 'size.device-breakpoints.tablet');
  const desktop = resolveNumericValue(tokensRoot, 'size.device-breakpoints.desktop');
  if (typeof tablet !== 'number' || typeof desktop !== 'number') {
    console.warn('Skipping components/breakpoints.js -- Device Breakpoints/Tablet and/or /Desktop not found in this export.');
    return;
  }

  const content = `// Shared responsive breakpoints -- GENERATED FILE, do not hand-edit.
//
// Source of truth: the "Device Breakpoints" variables in Figma's Size
// collection (Tablet/Desktop, each aliased to a Container primitive).
// Regenerate the same way as tokens.json/css/tokens.css:
//   1. Change values in Figma.
//   2. Export variables with the plugin, overwrite tokens/source/figma-variables.json.
//   3. Re-run \`node tokens/build-tokens.js\`.
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
  tablet: ${tablet},
  desktop: ${desktop},
};

// Ready-made condition strings for the two shapes components actually
// need. Add more here (rather than in a component file) if a third shape
// comes up.
export const QUERY_DESKTOP = \`(min-width: \${BREAKPOINTS.desktop}px)\`;
export const QUERY_TABLET_ONLY = \`(min-width: \${BREAKPOINTS.tablet}px) and (max-width: \${BREAKPOINTS.desktop - 1}px)\`;
`;

  fs.mkdirSync(path.dirname(BREAKPOINTS_OUT), { recursive: true });
  fs.writeFileSync(BREAKPOINTS_OUT, content);
  console.log(`wrote ${path.relative(ROOT, BREAKPOINTS_OUT)} (tablet: ${tablet}px, desktop: ${desktop}px)`);
}

function main() {
  const raw = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));

  // Pass 1: index every variable's DTCG path so aliases resolve regardless of order.
  const pathIndex = new Map();
  for (const [collectionName, collection] of Object.entries(raw)) {
    for (const variableName of Object.keys(collection.variables)) {
      pathIndex.set(`${collectionName}|||${variableName}`, tokenPathFor(collectionName, variableName));
    }
  }

  function resolveValue(modeValue) {
    if (modeValue && modeValue.$alias) {
      const key = `${modeValue.$alias.collection}|||${modeValue.$alias.name}`;
      const targetPath = pathIndex.get(key);
      if (!targetPath) throw new Error(`Unresolved alias: ${JSON.stringify(modeValue.$alias)}`);
      return { isRef: true, ref: targetPath.join('.') };
    }
    if (modeValue && typeof modeValue === 'object' && 'hex' in modeValue) {
      return { isRef: false, value: colorToHex(modeValue) };
    }
    return { isRef: false, value: cleanNumber(modeValue) };
  }

  const tokensRoot = {};
  let primitiveCount = 0;
  let semanticCount = 0;

  const warnings = [];

  for (const [collectionName, collection] of Object.entries(raw)) {
    const modeNames = collection.modes.map((m) => m.name);
    const isMultiMode = modeNames.length > 1;

    for (const [variableName, variable] of Object.entries(collection.variables)) {
      try {
        const tokenPath = tokenPathFor(collectionName, variableName);
        const modeToUse = isMultiMode
          ? (modeNames.includes(DEFAULT_MODE) ? DEFAULT_MODE : modeNames[0])
          : modeNames[0];

        const resolved = resolveValue(variable.valuesByMode[modeToUse]);
        const token = {
          $type: TYPE_MAP[variable.type] || variable.type.toLowerCase(),
          $value: resolved.isRef ? `{${resolved.ref}}` : resolved.value,
        };
        if (variable.description) token.$description = variable.description;

        if (isMultiMode) {
          const modes = {};
          for (const modeName of modeNames) {
            const r = resolveValue(variable.valuesByMode[modeName]);
            modes[kebab(modeName.replace(/^SDS\s+/, ''))] = r.isRef ? `{${r.ref}}` : r.value;
          }
          token.$extensions = { modes };
          semanticCount++;
        } else {
          primitiveCount++;
        }

        setDeep(tokensRoot, tokenPath, token);
      } catch (err) {
        warnings.push(`${collectionName} / ${variableName}: ${err.message}`);
      }
    }
  }

  for (const group of SHADOW_GROUPS) composeShadowTokens(tokensRoot, group);
  composeGradientTokens(tokensRoot);

  fs.mkdirSync(path.dirname(TOKENS_OUT), { recursive: true });
  fs.writeFileSync(TOKENS_OUT, JSON.stringify(tokensRoot, null, 2) + '\n');

  const lines = [];
  // Which numeric tokens are px dimensions vs. bare multipliers/ratios.
  // - Size/* (color/border widths, space, radius, blur, depth) -- always px.
  // - Typography Primitives Size/* and Line Height/* (font sizes, line heights) -- always px.
  // - Responsive/Device Width -- a breakpoint value in px.
  // NOT px: Responsive/Scale (a unitless ratio multiplier).
  function isPxDimension(pathArr) {
    if (pathArr[0] === 'size') return true;
    if (pathArr[0] === 'typography-primitives' && (pathArr[1] === 'size' || pathArr[1] === 'line-height')) return true;
    if (pathArr[0] === 'responsive' && pathArr[1] === 'device-width') return true;
    return false;
  }
  function walk(node, pathArr) {
    if (node && typeof node.$value !== 'undefined') {
      const varName = '--' + pathArr.join('-');

      if (node.$type === 'shadow') {
        const shadows = Array.isArray(node.$value) ? node.$value : [node.$value];
        // Shadow lengths can come through as bare numbers (the elevation
        // values are literal in Figma, not primitive refs); CSS requires a
        // unit on every non-zero length, so bare numbers get px here.
        const length = (v) => (typeof v === 'number' ? `${v}px` : refToVar(v));
        const layers = shadows.map((s) =>
          [s.offsetX, s.offsetY, s.blur, s.spread].map(length).concat(refToVar(s.color)).join(' ')
        );
        lines.push(`  ${varName}: ${layers.join(', ')};`);
        return;
      }

      if (node.$type === 'gradient') {
        const g = node.$value;
        const stops = g.stops.map((st) => `${refToVar(st.color)} ${st.position}%`).join(', ');
        lines.push(`  ${varName}: radial-gradient(${g.shape} ${g.size} at ${g.position}, ${stops});`);
        return;
      }

      let cssValue = node.$value;
      if (typeof cssValue === 'string') {
        cssValue = refToVar(cssValue);
      } else if (node.$type === 'number' && isPxDimension(pathArr)) {
        cssValue = `${cssValue}px`;
      }
      lines.push(`  ${varName}: ${cssValue};`);
      return;
    }
    for (const key of Object.keys(node)) walk(node[key], pathArr.concat(key));
  }

  lines.push('/* Generated by tokens/build-tokens.js from tokens/source/figma-variables.json — do not hand-edit. */');
  lines.push(':root {');
  if (tokensRoot.color) {
    lines.push('  /* Color primitives */');
    if (tokensRoot.color.primitive) walk(tokensRoot.color.primitive, ['color', 'primitive']);
    lines.push('');
    lines.push('  /* Color semantic (Light mode) */');
    for (const key of Object.keys(tokensRoot.color)) {
      if (key === 'primitive') continue;
      walk(tokensRoot.color[key], ['color', key]);
    }
  }
  for (const topKey of Object.keys(tokensRoot)) {
    if (topKey === 'color') continue;
    lines.push('');
    lines.push(`  /* ${topKey} */`);
    walk(tokensRoot[topKey], [topKey]);
  }
  lines.push('}');

  fs.mkdirSync(path.dirname(CSS_OUT), { recursive: true });
  fs.writeFileSync(CSS_OUT, lines.join('\n') + '\n');

  if (warnings.length) {
    console.warn('Skipped (unresolved references) -- resolve these once that collection is included:');
    warnings.forEach((w) => console.warn('  - ' + w));
    console.warn('');
  }
  writeBreakpointsFile(tokensRoot);

  console.log(`primitive tokens: ${primitiveCount}`);
  console.log(`semantic tokens: ${semanticCount}`);
  console.log(`wrote ${path.relative(ROOT, TOKENS_OUT)}`);
  console.log(`wrote ${path.relative(ROOT, CSS_OUT)}`);
}

main();
