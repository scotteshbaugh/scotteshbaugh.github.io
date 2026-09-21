// <ds-divider> — Divider web component
//
// Purely presentational: a colored rule, no content, no interactive states.
// Every value comes from css/tokens.css custom properties, inherited through
// the shadow boundary — no hardcoded colors or sizes here.
//
// Attributes:
//   orientation  "horizontal" | "vertical"  (default: "horizontal")
//   size         "small" | "medium" | "large"  (default: "small")
//                thickness via Size/Stroke 25/50/100 (1px/2px/4px)
//   shape        "sharp" | "rounded"  (default: "sharp")
//                rounded adds Size/Radius 50 (2px) corners
//   emphasis     "subtle" | "strong"  (default: "subtle")
//                subtle = Background/Neutral/Tertiary (the light rule used
//                almost everywhere); strong = Background/Neutral/Default,
//                the darker rule, opt-in. Named for how much the line
//                stands out rather than its color, so it still reads
//                correctly if a dark theme ever flips the values.
//
// Usage:
//   <ds-divider></ds-divider>
//   <ds-divider size="large" shape="rounded"></ds-divider>
//   <ds-divider emphasis="strong"></ds-divider>
//   <ds-divider orientation="vertical"></ds-divider>  <!-- needs a sized
//     or flex parent — a bare rule has no length of its own. In a flex row,
//     it stretches automatically (align-self: stretch is set by default);
//     in a block layout, give it an explicit height. -->

const DIVIDER_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
  }

  :host([emphasis="subtle"]) { background: var(--color-background-neutral-tertiary); }
  :host([emphasis="strong"]) { background: var(--color-background-neutral-default); }

  :host([size="small"])  { --divider-thickness: var(--size-primitive-stroke-25); }
  :host([size="medium"]) { --divider-thickness: var(--size-primitive-stroke-50); }
  :host([size="large"])  { --divider-thickness: var(--size-primitive-stroke-100); }

  :host([shape="rounded"]) { border-radius: var(--size-primitive-radius-50); }
  :host([shape="sharp"])   { border-radius: 0; }

  :host([orientation="horizontal"]) {
    display: block;
    width: 100%;
    height: var(--divider-thickness);
  }

  :host([orientation="vertical"]) {
    display: inline-block;
    align-self: stretch;   /* fills the cross-axis automatically in a flex row --
      this is the only sizing mechanism that works when the row's height is
      auto/content-based (the common case). A specified height (e.g. 100%)
      here would take priority over stretch per the flexbox spec, and would
      resolve to 0 against a parent whose height isn't definite -- so no
      height fallback is set; a vertical divider needs a flex row parent. */
    width: var(--divider-thickness);
  }
</style>
`;

class DsDivider extends HTMLElement {
  static observedAttributes = ["orientation"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = DIVIDER_TEMPLATE;
  }

  connectedCallback() {
    if (!this.hasAttribute("orientation")) this.setAttribute("orientation", "horizontal");
    if (!this.hasAttribute("size")) this.setAttribute("size", "small");
    if (!this.hasAttribute("shape")) this.setAttribute("shape", "sharp");
    if (!this.hasAttribute("emphasis")) this.setAttribute("emphasis", "subtle");

    this.setAttribute("role", "separator");
    this._syncOrientation();
  }

  attributeChangedCallback(name) {
    if (name === "orientation") this._syncOrientation();
  }

  _syncOrientation() {
    // ARIA separator defaults to horizontal, so only set aria-orientation
    // when it diverges from that default.
    if (this.getAttribute("orientation") === "vertical") {
      this.setAttribute("aria-orientation", "vertical");
    } else {
      this.removeAttribute("aria-orientation");
    }
  }
}

customElements.define("ds-divider", DsDivider);
