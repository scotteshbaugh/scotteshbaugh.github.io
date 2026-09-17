// <ds-icon> — Icon web component
//
// Renders one Feather icon at one of the design system's five sizes, with
// the stroke weight Figma specifies for that size.
//
// -- Why the stroke needs a component at all --
// These icons are stroked, not filled, and an SVG's stroke-width is in
// viewBox units, so it normally scales with the icon: Feather's 2 units in
// a 24 viewBox is always 1/12th of the rendered size. Figma does not scale
// linearly -- the icon sheets carry hand-tuned weights (1.6 / 2 / 2.5 / 3 /
// 4) so small icons don't go spindly. Linear scaling and Figma agree at 48
// and nowhere else.
//
// The fix is `vector-effect: non-scaling-stroke` on the shapes: it takes
// stroke-width out of the viewBox coordinate system, so the value is read
// in screen pixels. That means --size-icon-stroke-<size> can be applied
// directly, exactly as Figma states it, with no conversion arithmetic in
// this file. Change 1.6 in Figma, re-export, and the icon follows.
//
// -- Why the icons are inlined --
// Fetching assets/icons/<name>.svg at runtime would cost a request and a
// blank frame per icon. The whole set inlines to ~10KB over the wire once
// compressed, so the registry carries all 287 rather than being curated --
// any icon is available by name with nothing to add first.
//
// components/icon-registry.js is GENERATED from assets/icons/ by
// tokens/build-icons.js; re-run that after changing anything in there. The
// wrapper attributes (viewBox, fill, stroke, linecap, linejoin) are
// identical across every Feather file, so they live in the template below
// rather than being repeated 287 times in the registry.
//
// -- Color --
// Deliberately not an attribute. The shapes use stroke="currentColor", so
// the icon takes the `color` of whatever contains it, and the host picks
// that from the --color-icon-* tokens. A color property here would let a
// caller sidestep those.
//
// Attributes:
//   name   which icon, matching a filename in assets/icons (e.g. "x",
//          "chevron-down", "external-link") -- all 287 are available
//   size   16 | 20 | 24 | 32 | 48   (default: 24)
//   label  an accessible name, for an icon that carries meaning on its own
//          (see below). Omit it for the usual decorative case.
//
// -- Accessibility: decorative by default --
// With no `label`, the icon is announced to nobody: the <svg> is
// aria-hidden and the host has no role. That is correct almost everywhere,
// because an icon nearly always sits inside something that already has a
// name -- the dismiss button in tag.js carries its own aria-label, a link
// has its text, a button has its label. Labelling the icon too makes a
// screen reader say both ("Remove Blocked, close").
//
// With a `label`, the host takes role="img" and aria-label, and the <svg>
// stays aria-hidden so the name is announced exactly once. The role goes on
// the host rather than inside the shadow root because that is the element
// assistive tech actually walks.
//
// When to use it: only when the icon is the whole content AND nothing
// around it names it. An icon on its own as a status marker, say. If there
// is visible text beside it, or any labelled control around it, leave the
// label off -- that icon is decoration even if it looks meaningful.
//
// Usage:
//   <ds-icon name="x" size="16"></ds-icon>
//   <ds-icon name="check" size="16" label="Passed"></ds-icon>

import { ICONS } from "./icon-registry.js";

const SIZES = ["16", "20", "24", "32", "48"];
const DEFAULT_SIZE = "24";

// One rule per size rather than a calc: each one pairs the box with the
// stroke token named for that same size, so the two can't drift apart.
const SIZE_RULES = SIZES.map((s) => `
  :host([size="${s}"]) {
    width: ${s}px;
    height: ${s}px;
  }
  :host([size="${s}"]) svg > * {
    stroke-width: var(--size-icon-stroke-${s});
  }
`).join("");

const ICON_TEMPLATE = /* html */ `
<style>
  :host {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    color: inherit;
  }

  ${SIZE_RULES}

  svg {
    display: block;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  /* Takes stroke-width out of the viewBox coordinate system so the token's
     pixel value is what actually gets drawn -- see the file header. */
  svg > * {
    vector-effect: non-scaling-stroke;
  }
</style>
<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
     stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></svg>
`;

class DsIcon extends HTMLElement {
  static get observedAttributes() {
    return ["name", "size", "label"];
  }

  connectedCallback() {
    if (!SIZES.includes(this.getAttribute("size"))) {
      this.setAttribute("size", DEFAULT_SIZE);
    }

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = ICON_TEMPLATE;
    }
    this._render();
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (oldValue === newValue || !this.shadowRoot) return;
    if (attr === "size" && !SIZES.includes(newValue)) {
      this.setAttribute("size", DEFAULT_SIZE);
      return;
    }
    this._render();
  }

  // role/aria-label live on the host, not the shadow <svg> -- see the
  // accessibility note in the file header.
  _syncLabel() {
    const label = this.getAttribute("label");
    if (label) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", label);
    } else {
      this.removeAttribute("role");
      this.removeAttribute("aria-label");
    }
  }

  _render() {
    const svg = this.shadowRoot.querySelector("svg");
    if (!svg) return;

    this._syncLabel();

    const name = this.getAttribute("name");
    const markup = ICONS[name];

    if (!markup) {
      // Render nothing rather than a broken glyph, but say so -- a typo'd
      // name and an icon that hasn't been added to ICONS yet look identical
      // on screen otherwise.
      svg.innerHTML = "";
      if (name) console.warn(`<ds-icon>: no icon named "${name}" -- see assets/icons/ for the available names`);
      return;
    }

    svg.innerHTML = markup;
  }
}

customElements.define("ds-icon", DsIcon);
