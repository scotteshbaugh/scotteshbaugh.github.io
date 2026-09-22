// <ds-card-image> — Card Image web component
//
// The case-study card's cover frame (Figma "Card Image", node 132:899).
// It does not draw an image surface of its own: it nests a
// <ds-image placement="card"> -- the same primitive the standalone and
// lightbox images are built from -- and contributes only what is specific
// to sitting at the top of a card:
//
//   - the brand bleed showing either side of a capped image
//   - a fixed row height, so every card's cover is the same size
//   - centering
//
// This mirrors how Figma composes it (an Image instance inside the Card
// Image frame) rather than restating the surface, so a change to the image
// surface cascades into the card without being made twice. The image's own
// crop-to-fill lives in image.js under placement="card"; see the sizing
// note in that file's header for why the card is the one placement that
// fills rather than hugs.
//
// -- The row height is fixed, not a range --
// Container/400 (320px) on Compact, Container/500 (400px) from Medium up,
// matching the card's Compact and Medium/Expanded variants in Figma. It
// does not flex with the card's own content: every cover in the list is
// the same height whether its card's text column is short or long.
//
// The Image instance inside it still carries Figma's own min-height of
// Container/300 (240) alongside the Container/500 cap. At a pinned 400px
// row the floor never engages -- it is kept because it is what the Figma
// instance specifies, and because it is the thing that would keep the
// frame from collapsing if this host is ever given a flexible height
// again (inside a flex parent with no definite height, a flex item's
// floor is 0 without a real min-height, and overflow: hidden would clip
// the image away invisibly).
//
// Every value is a token from css/tokens.css. The 1000/300/400/10px raw
// pixel values the previous version documented as "specific to this one
// component, nothing in tokens.css to bind them to" are gone: they are
// Container tokens in Figma now, and the values moved slightly in the
// process (max-width 1000 -> 1040, min-height 300 -> 240, and the 10px
// pad dropped entirely).
//
// Usage:
//   <ds-card-image>
//     <img src="assets/covers/ss_cover.jpg" alt="Screenshot of the cover">
//   </ds-card-image>

import { nestImage } from "./nest-image.js";
import { QUERY_MEDIUM } from "./breakpoints.js";

const CARD_IMAGE_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    width: 100%;
    height: var(--size-primitive-container-400); /* 320px, Compact */
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: var(--color-background-brand-secondary);
  }

  /* The image fills the row's height and stops growing sideways at
     Container/1300 -- past that this host keeps going and the brand
     background shows as side edges; below it the image is flush with
     the host and no bleed is visible. The height bounds mirror the
     overrides Figma puts on this same instance; see the header for why
     the floor is kept at a pinned row height. */
  ::slotted(ds-image) {
    height: 100%;
    max-height: var(--size-primitive-container-500);
    min-height: var(--size-primitive-container-300);
    max-width: var(--size-primitive-container-1300);
  }

  /* Medium and up: the taller 400px row (Container/500). */
  @media ${QUERY_MEDIUM} {
    :host {
      height: var(--size-primitive-container-500);
    }
  }
</style>
<slot></slot>
`;

class DsCardImage extends HTMLElement {
  connectedCallback() {
    nestImage(this, "card");

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = CARD_IMAGE_TEMPLATE;
    }
  }
}

customElements.define("ds-card-image", DsCardImage);
