// <ds-button> — Button web component
//
// A text button with optional icons at either end (Figma "Button", node
// 277:58599). Wraps a real <button>, so keyboard activation, focus, the
// disabled state and click events all come from the platform rather than
// being reimplemented -- same call ds-icon-button makes, and the two share
// their whole behaviour contract on purpose.
//
// Attributes:
//   variant     "primary" | "neutral" | "subtle"  (default: "primary")
//   size        "medium" | "small"                (default: "medium")
//               only changes padding (Space/300 vs Space/200), exactly as
//               Figma models it -- type and icons stay the same size.
//   icon-start  optional icon name from assets/icons, drawn before the label
//   icon-end    optional icon name, drawn after the label
//   disabled    boolean attribute. Reflected onto the inner <button>, so it
//               stops firing clicks and leaves the tab order for free.
//
// Unlike ds-icon-button there is no `label` attribute: this button has
// visible text, and that text IS its accessible name. The label is slotted
// light DOM, so it stays selectable, translatable and readable by
// assistive tech without any aria-label.
//
// Hover is a CSS state, not an attribute: Figma models it as a variant
// because Figma has no pseudo-classes, but in a browser :hover is the
// honest translation. Disabled is an attribute because it is a property of
// the button, not of the pointer.
//
// -- Line height is `normal`, not a token --
// Figma sets the label's line height to Auto, which means "use the font's
// own metrics". That is not a value, so there is no variable to bind in
// Figma and no token to read here -- `normal` is the CSS equivalent. The
// --typography-button-line-height token exists but is deliberately unused
// for this reason; see the Subhead notes in css/case-study.css for the
// same distinction between values (tokens) and structure (the component).
//
// -- Why the border is a box-shadow --
// Figma's stroke is INSIDE, so it does not add to the button's box. A CSS
// border would. An inset box-shadow paints the same ring without taking
// part in layout. Same reasoning, same implementation as ds-icon-button.
//
// -- Subtle's hover is a border, not a fill --
// Every other variant darkens its background on hover. Subtle has no
// background at all, and Figma gives it a border on hover instead. That is
// what is drawn here; it differs from ds-icon-button's subtle, which does
// change its background.
//
// Usage:
//   <ds-button>Save</ds-button>
//   <ds-button variant="subtle" size="small" icon-end="arrow-right">Next</ds-button>
//   <ds-button variant="neutral" icon-start="x" disabled>Cancel</ds-button>
//
// Clicks: the inner <button>'s click event is composed, so it crosses the
// shadow boundary and retargets to the host. Listen on <ds-button>
// directly; there is no custom event to learn.

import "./icon.js";

const VARIANTS = ["primary", "neutral", "subtle"];
const SIZES = ["medium", "small"];
const DEFAULT_VARIANT = "primary";
const DEFAULT_SIZE = "medium";

// Figma draws a 16px icon in both button sizes.
const ICON_SIZE = "16";

const BUTTON_TEMPLATE = /* html */ `
<style>
  :host {
    display: inline-flex;
    flex: none;
  }

  /* ---- variant palettes ---- */

  :host([variant="primary"]) {
    --btn-bg: var(--color-background-brand-default);
    --btn-bg-hover: var(--color-background-brand-hover);
    --btn-border: var(--color-border-brand-default);
    --btn-border-hover: var(--color-border-brand-default);
    --btn-fg: var(--color-text-brand-on-brand);
  }

  :host([variant="neutral"]) {
    --btn-bg: var(--color-background-neutral-tertiary);
    --btn-bg-hover: var(--color-background-neutral-tertiary-hover);
    --btn-border: var(--color-border-neutral-secondary);
    --btn-border-hover: var(--color-border-neutral-secondary);
    --btn-fg: var(--color-text-default-default);
  }

  /* Subtle has no fill or stroke at rest -- both are declared transparent
     so the painted box matches the other variants exactly, and only the
     colour changes on hover. Figma's hover for this variant adds a border
     rather than a background. */
  :host([variant="subtle"]) {
    --btn-bg: transparent;
    --btn-bg-hover: transparent;
    --btn-border: transparent;
    --btn-border-hover: var(--color-border-default-default);
    --btn-fg: var(--color-text-default-default);
  }

  /* Disabled flattens every variant to the same appearance -- that is what
     Figma specifies, not a shortcut taken here. Declared after the variants
     so it wins regardless of which one is set. */
  :host([disabled]) {
    --btn-bg: var(--color-background-disabled-default);
    --btn-bg-hover: var(--color-background-disabled-default);
    --btn-border: var(--color-border-disabled-default);
    --btn-border-hover: var(--color-border-disabled-default);
    --btn-fg: var(--color-text-disabled-on-disabled);
  }

  /* ---- size: padding only ---- */

  :host([size="medium"]) { --btn-pad: var(--size-primitive-space-300); }
  :host([size="small"])  { --btn-pad: var(--size-primitive-space-200); }

  /* ---- the button ---- */

  .button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--size-primitive-space-200);
    padding: var(--btn-pad);
    border-radius: var(--size-primitive-radius-200);
    background: var(--btn-bg);
    color: var(--btn-fg);
    /* The inside stroke -- see the file header for why this isn't border. */
    box-shadow: inset 0 0 0 var(--size-primitive-stroke-25) var(--btn-border);
    cursor: pointer;

    font-family: var(--typography-button-font-family), sans-serif;
    font-size: var(--typography-button-size);
    /* Deliberately 'normal', not a token -- see the file header. */
    line-height: normal;
    /* No font-weight token: the weight primitives export as strings
       ("Regular"), which aren't valid CSS, and FF Good Pro Wide only has
       one weight registered in fonts.css. Same call ds-summary makes. */
    text-align: center;
  }

  .button:hover {
    background: var(--btn-bg-hover);
    box-shadow: inset 0 0 0 var(--size-primitive-stroke-25) var(--btn-border-hover);
  }

  .button:focus-visible {
    outline: var(--size-primitive-stroke-focus-ring) solid var(--btn-fg);
    outline-offset: 1px;
  }

  .button:disabled {
    cursor: not-allowed;
  }

  /* Icons are hidden until their attribute names one, so the gap never
     opens for an icon that isn't there. */
  ds-icon[hidden] { display: none; }

  ::slotted(*) { margin: 0; }
</style>
<button class="button" part="button" type="button">
  <ds-icon part="icon-start" size="${ICON_SIZE}" hidden></ds-icon>
  <slot></slot>
  <ds-icon part="icon-end" size="${ICON_SIZE}" hidden></ds-icon>
</button>
`;

class DsButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "icon-start", "icon-end", "disabled"];
  }

  connectedCallback() {
    if (!VARIANTS.includes(this.getAttribute("variant"))) {
      this.setAttribute("variant", DEFAULT_VARIANT);
    }
    if (!SIZES.includes(this.getAttribute("size"))) {
      this.setAttribute("size", DEFAULT_SIZE);
    }

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = BUTTON_TEMPLATE;
    }
    this._render();
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (oldValue === newValue || !this.shadowRoot) return;
    if (attr === "variant" && !VARIANTS.includes(newValue)) {
      this.setAttribute("variant", DEFAULT_VARIANT);
      return;
    }
    if (attr === "size" && !SIZES.includes(newValue)) {
      this.setAttribute("size", DEFAULT_SIZE);
      return;
    }
    this._render();
  }

  get _button() {
    return this.shadowRoot.querySelector(".button");
  }

  _render() {
    const button = this._button;
    if (!button) return;

    this._syncIcon('[part="icon-start"]', "icon-start");
    this._syncIcon('[part="icon-end"]', "icon-end");

    button.disabled = this.hasAttribute("disabled");
  }

  // An icon with no name would render an empty box and still open the
  // flex gap, so the element is hidden outright when unused.
  _syncIcon(selector, attr) {
    const icon = this.shadowRoot.querySelector(selector);
    if (!icon) return;
    const name = this.getAttribute(attr);
    if (name) {
      icon.setAttribute("name", name);
      icon.hidden = false;
    } else {
      icon.removeAttribute("name");
      icon.hidden = true;
    }
  }
}

customElements.define("ds-button", DsButton);
