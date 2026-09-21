// <ds-pullout> — Pullout web component
//
// A large pull-quote/statement block for a case study (Figma "Pullout",
// node 210:947). Two variants: a plain statement ("statement") and an attributed
// quote ("quote"). Pulls every value from css/tokens.css
// custom properties, inherited through the shadow boundary -- no
// hardcoded colors, sizes, or fonts here.
//
// Fluid width (:host { width: 100% }), not the fixed width Figma's
// isolated component definition shows (528px): the real case-study page
// (node 34:1353, "Context") places Pullout next to a List in a shared
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
//   type   "statement" | "quote"  (default: "statement")
//          "statement": header slot only, no quote marks, no attribution.
//          "quote": header slot wrapped in curly quotes, plus an
//          attribution slot prefixed with an em dash.
//
// Responsive header size: mobile default is Heading 4 (smaller), stepping
// up to Heading 3 at Tablet and staying there through Desktop -- same
// single-breakpoint mobile-only swap as card-case-study.js's own
// slot[name="header"]. Figma now states this explicitly: Pullout has a
// Device property (Desktop | Mobile) alongside Type.
//
// Slots:
//   header        the statement or quote text (required, both variants)
//   attribution   who said it -- only rendered when type="quote"
//
// Usage:
//   <ds-pullout>
//     <span slot="header">Title about something or someone.</span>
//   </ds-pullout>
//
//   <ds-pullout type="quote">
//     <span slot="header">Quote about something or someone.</span>
//     <span slot="attribution">Person</span>
//   </ds-pullout>

import { BREAKPOINTS } from "./breakpoints.js";

const PULLOUT_TEMPLATE = /* html */ `
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

  .pullout__header {
    margin: 0;
    font-family: var(--typography-heading-font-family), sans-serif;
    /* Mobile: Heading 4 -- Figma Pullout Device=Mobile.
       Tablet/Desktop step up to Heading 3 (Device=Desktop) below. */
    font-size: var(--typography-heading-size-4);
    line-height: var(--typography-heading-line-height-4);
    /* No font-weight token here on purpose -- FF Good Pro Wide only has
       one weight registered (500/Medium) in fonts.css, same reasoning
       Tag and Summary's labels document for themselves. */
    color: var(--color-text-default-default);
  }

  @media (min-width: ${BREAKPOINTS.tablet}px) {
    .pullout__header {
      font-size: var(--typography-heading-size-3);
      line-height: var(--typography-heading-line-height-3);
    }
  }

  /* Quote marks are this component's furniture, not typed content --
     wraps whatever's slotted in with curly quotes. */
  :host([type="quote"]) .pullout__header::before {
    content: "\\201C";
  }
  :host([type="quote"]) .pullout__header::after {
    content: "\\201D";
  }

  .pullout__attribution {
    display: none;
    margin: 0;
    font-family: var(--typography-heading-font-family), sans-serif;
    font-size: var(--typography-heading-size-6);
    line-height: var(--typography-heading-line-height-6);
    color: var(--color-text-default-secondary);
  }

  :host([type="quote"]) .pullout__attribution {
    display: block;
  }

  /* Em dash is furniture too, same reasoning as the quote marks. */
  .pullout__attribution::before {
    content: "\\2014";
  }
</style>
<p class="pullout__header"><slot name="header"></slot></p>
<p class="pullout__attribution"><slot name="attribution"></slot></p>
`;

class DsPullout extends HTMLElement {
  connectedCallback() {
    if (!this.hasAttribute("type")) this.setAttribute("type", "statement");

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = PULLOUT_TEMPLATE;
    }
  }
}

customElements.define("ds-pullout", DsPullout);
