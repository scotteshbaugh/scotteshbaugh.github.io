// <ds-icon-button> — Icon Button web component
//
// A round button whose only content is an icon (Figma "Icon Button", node
// 277:58495). Wraps a real <button>, so keyboard activation, focus, the
// disabled state and click events all come from the platform rather than
// being reimplemented.
//
// Attributes:
//   variant   "primary" | "neutral" | "subtle"   (default: "primary")
//   size      "medium" | "small"                 (default: "medium")
//   icon      which icon to draw -- any name in assets/icons (e.g. "x")
//   label     REQUIRED. The button's accessible name ("Close", "Next
//             image"). There is no visible text, so without this the
//             button is unusable with a screen reader.
//   disabled  boolean attribute. Reflected onto the inner <button>, so it
//             stops firing clicks and leaves the tab order for free.
//
// Hover is a CSS state, not an attribute: Figma models it as a variant
// because Figma has no pseudo-classes, but in a browser :hover is the
// honest translation. Disabled is an attribute because it is a property of
// the button, not of the pointer.
//
// -- Size does not change the icon --
// Both sizes draw a 20px icon; only the padding differs (Space/300 on
// medium, Space/200 on small), which is what makes them 44px and 36px.
// That is Figma's own model, and it is why `size` here doesn't reach into
// ds-icon -- it only sets the padding token.
//
// -- Why the border is a box-shadow --
// Figma's stroke is INSIDE, so it does not add to the 44/36 box. A CSS
// border would: with padding from tokens and the box hugging its content,
// a 1px border makes the button 46px, not 44. An inset box-shadow paints
// the same ring without taking part in layout, which is exactly what
// INSIDE means. `outline` would also work, but it is spent on the focus
// ring, and the two would fight.
//
// Every colour and size is a token from css/tokens.css, selected per
// variant into local custom properties below -- the same shape ds-tag uses
// for its schemes.
//
// Usage:
//   <ds-icon-button icon="x" label="Close"></ds-icon-button>
//   <ds-icon-button variant="subtle" size="small" icon="chevron-left"
//                   label="Previous"></ds-icon-button>
//
// Clicks: the inner <button>'s click event is composed, so it crosses the
// shadow boundary and retargets to the host. Listen on <ds-icon-button>
// directly; there is no custom event to learn.

import "./icon.js";

const VARIANTS = ["primary", "neutral", "subtle"];
const SIZES = ["medium", "small"];
const DEFAULT_VARIANT = "primary";
const DEFAULT_SIZE = "medium";

// Figma draws the same 20px icon in both sizes -- see the file header.
const ICON_SIZE = "20";

const ICON_BUTTON_TEMPLATE = /* html */ `
<style>
  :host {
    display: inline-flex;
    flex: none;
  }

  /* ---- variant palettes ---- */

  :host([variant="primary"]) {
    --ib-bg: var(--color-background-brand-default);
    --ib-bg-hover: var(--color-background-brand-hover);
    --ib-border: var(--color-border-brand-default);
    --ib-fg: var(--color-icon-brand-on-brand);
  }

  :host([variant="neutral"]) {
    --ib-bg: var(--color-background-default-secondary);
    --ib-bg-hover: var(--color-background-default-secondary-hover);
    --ib-border: var(--color-border-default-default);
    --ib-fg: var(--color-icon-default-default);
  }

  /* Subtle has no fill or stroke at rest. Both are still declared, as
     transparent, so the painted box is identical in size to the other two
     variants -- only the colour differs. */
  :host([variant="subtle"]) {
    --ib-bg: transparent;
    --ib-bg-hover: var(--color-background-default-default-hover);
    --ib-border: transparent;
    --ib-fg: var(--color-icon-default-default);
  }

  /* Disabled flattens every variant to the same appearance -- that is what
     Figma specifies, not a shortcut taken here. Declared after the variants
     so it wins regardless of which one is set. */
  :host([disabled]) {
    --ib-bg: var(--color-background-disabled-default);
    --ib-bg-hover: var(--color-background-disabled-default);
    --ib-border: var(--color-border-disabled-default);
    --ib-fg: var(--color-icon-disabled-on-disabled);
  }

  /* ---- size ---- */

  :host([size="medium"]) { --ib-pad: var(--size-primitive-space-300); }
  :host([size="small"])  { --ib-pad: var(--size-primitive-space-200); }

  /* ---- the button ---- */

  .button {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--ib-pad);
    border-radius: var(--size-primitive-radius-full);
    background: var(--ib-bg);
    color: var(--ib-fg);
    /* The inside stroke -- see the file header for why this isn't border. */
    box-shadow: inset 0 0 0 var(--size-primitive-stroke-25) var(--ib-border);
    cursor: pointer;
  }

  .button:hover {
    background: var(--ib-bg-hover);
  }

  .button:focus-visible {
    outline: var(--size-primitive-stroke-focus-ring) solid var(--ib-fg);
    outline-offset: 1px;
  }

  .button:disabled {
    cursor: not-allowed;
  }
</style>
<button class="button" part="button" type="button">
  <ds-icon size="${ICON_SIZE}"></ds-icon>
</button>
`;

class DsIconButton extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "icon", "label", "disabled"];
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
      root.innerHTML = ICON_BUTTON_TEMPLATE;
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
    const icon = this.shadowRoot.querySelector("ds-icon");
    if (!button || !icon) return;

    const name = this.getAttribute("icon");
    if (name) icon.setAttribute("name", name);
    else icon.removeAttribute("name");

    // The button has no text of its own, so the label is the only thing
    // standing between it and being announced as an unnamed button.
    const label = this.getAttribute("label");
    if (label) {
      button.setAttribute("aria-label", label);
    } else {
      button.removeAttribute("aria-label");
      console.warn('<ds-icon-button>: no "label" -- an icon-only button has no accessible name without one');
    }

    button.disabled = this.hasAttribute("disabled");
  }
}

customElements.define("ds-icon-button", DsIconButton);
