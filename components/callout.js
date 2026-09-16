// <ds-callout> — Callout web component
//
// A large pull-quote/statement block for a case study (Figma "Callout",
// node 210:947). Two variants: a plain statement ("default") and an
// attributed quote ("quote"). Pulls every value from css/tokens.css
// custom properties, inherited through the shadow boundary -- no
// hardcoded colors, sizes, or fonts here.
//
// Fluid width (:host { width: 100% }), not the fixed width Figma's
// isolated component definition shows (528px): the real case-study page
// (node 34:1353, "Context") places Callout next to a List in a shared
// row, where it actually renders at 485.67px -- a different number than
// the component sheet's own 528px -- confirming it's fill-sized in
// context, not a fixed box. Same reasoning as every other ds-* component
// here defaulting to width: 100%.
//
// Quote marks and the attribution's em dash are baked into this
// component's template (CSS generated content), not typed into the
// slotted text -- same "fixed template furniture, not per-instance
// content" pattern as Summary's field labels. Consumers slot in the bare
// quote text and the bare name.
//
// Attribute:
//   type   "default" | "quote"  (default: "default")
//          "default": header slot only, no quote marks, no attribution.
//          "quote": header slot wrapped in curly quotes, plus an
//          attribution slot prefixed with an em dash.
//
// Responsive header size: mobile default is Header 4 (smaller), stepping
// up to Header 3 at Tablet and staying there through Desktop -- same
// single-breakpoint mobile-only swap as card-case-study.js's own
// slot[name="header"] (Figma only ever defined one size for this
// component beyond the mobile-specific one Bosco asked for).
//
// Slots:
//   header        the statement or quote text (required, both variants)
//   attribution   who said it -- only rendered when type="quote"
//
// Usage:
//   <ds-callout>
//     <span slot="header">Title about something or someone.</span>
//   </ds-callout>
//
//   <ds-callout type="quote">
//     <span slot="header">Quote about something or someone.</span>
//     <span slot="attribution">Person</span>
//   </ds-callout>

import { BREAKPOINTS } from "./breakpoints.js";

const CALLOUT_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  :host([type="quote"]) {
    gap: var(--size-primitive-space-200);
  }

  .callout__header {
    margin: 0;
    font-family: var(--typography-heading-font-family), sans-serif;
    /* Mobile (default): Header 4. Figma only defines one size for this
       component -- Header 3 -- which is what Tablet/Desktop use below;
       Header 4 on Mobile is Bosco's own addition, same pattern as the
       card's header. */
    font-size: var(--typography-heading-header-size-4);
    line-height: var(--typography-heading-header-line-height-4);
    /* No font-weight token here on purpose -- FF Good Pro Wide only has
       one weight registered (500/Medium) in fonts.css, same reasoning
       Tag and Summary's labels document for themselves. */
    color: var(--color-text-default-default);
  }

  @media (min-width: ${BREAKPOINTS.tablet}px) {
    .callout__header {
      font-size: var(--typography-heading-header-size-3);
      line-height: var(--typography-heading-header-line-height-3);
    }
  }

  /* Quote marks are this component's furniture, not typed content --
     wraps whatever's slotted in with curly quotes. */
  :host([type="quote"]) .callout__header::before {
    content: "\\201C";
  }
  :host([type="quote"]) .callout__header::after {
    content: "\\201D";
  }

  .callout__attribution {
    display: none;
    margin: 0;
    font-family: var(--typography-heading-font-family), sans-serif;
    font-size: var(--typography-heading-header-size-6);
    line-height: var(--typography-heading-header-line-height-6);
    color: var(--color-text-default-secondary);
  }

  :host([type="quote"]) .callout__attribution {
    display: block;
  }

  /* Em dash is furniture too, same reasoning as the quote marks. */
  .callout__attribution::before {
    content: "\\2014";
  }
</style>
<p class="callout__header"><slot name="header"></slot></p>
<p class="callout__attribution"><slot name="attribution"></slot></p>
`;

class DsCallout extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute("type")) this.setAttribute("type", "default");

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = CALLOUT_TEMPLATE;
    }
  }
}

customElements.define("ds-callout", DsCallout);
