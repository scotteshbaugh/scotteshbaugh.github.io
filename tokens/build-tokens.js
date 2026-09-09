#!/usr/bin/env node
/**
 * Figma Variables -> DTCG tokens -> CSS custom properties
 *
 * Usage: node tokens/build-tokens.js
 * Reads:  tokens/source/figma-variables.json  (raw export from the Figma variables plugin)
 * Writes: tokens/tokens.json                  (DTCG-format design tokens)
 *         css/tokens.css                      (CSS custom properties, Light mode only)
 *
 * How to update your tokens:
 *   1. Change values in Figma.
 *   2. Export variables with the plugin, overwrite tokens/source/figma-variables.json.
 *   3. Re-run this script. Never hand-edit tokens.json or tokens.css directly.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_PATH = path.join(__dirname, 'source', 'figma-variables.json');
const TOKENS_OUT = path.join(__dirname, 'tokens.json');
const CSS_OUT = path.join(ROOT, 'css', 'tokens.css');

// Which Figma variable collection maps to which DTCG group path.
// Add an entry here whenever a new collection (Size, Typography, etc.) gets exported.
const COLLECTION_GROUP_MAP = {
  'Color Primitives': ['color', 'primitive'],
  'Color': ['color'],
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
    return { isRef: false, value: modeValue };
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

  fs.mkdirSync(path.dirname(TOKENS_OUT), { recursive: true });
  fs.writeFileSync(TOKENS_OUT, JSON.stringify(tokensRoot, null, 2) + '\n');

  const lines = [];
  function walk(node, pathArr) {
    if (node && typeof node.$value !== 'undefined') {
      const varName = '--' + pathArr.join('-');
      let cssValue = node.$value;
      if (typeof cssValue === 'string') {
        const refMatch = /^\{(.+)\}$/.exec(cssValue);
        if (refMatch) cssValue = `var(--${refMatch[1].split('.').join('-')})`;
      } else if (node.$type === 'number' && pathArr[0] === 'size') {
        // Every Size/* primitive is a px dimension (space, radius, blur, depth, stroke widths).
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
  console.log(`primitive tokens: ${primitiveCount}`);
  console.log(`semantic tokens: ${semanticCount}`);
  console.log(`wrote ${path.relative(ROOT, TOKENS_OUT)}`);
  console.log(`wrote ${path.relative(ROOT, CSS_OUT)}`);
}

main();
