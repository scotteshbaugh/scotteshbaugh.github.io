// <ds-card-case-study> — Card Case Study web component
//
// Composes Tag, Divider, List item, and Image (all reused untouched) into
// the case-study card. Every value comes from css/tokens.css; the card's
// own width is never fixed -- it fills 100% of whatever it's placed in.
// Figma's frame widths (1280/800/360px) are canvas snapshot sizes for each
// breakpoint bucket, not literal constraints.
//
// Breakpoints (real, not arbitrary -- these are the site's actual device
// breakpoints, meant to be reused elsewhere on the site):
//   < 768px          Mobile   -- stacked column, same grouping as Desktop
//   768px - 959px    Tablet   -- stacked column, but the Year/Role meta
//                                 list item moves up next to the tags
//                                 instead of sitting with the outcome text
//   >= 960px         Desktop  -- side by side, same grouping as Mobile
// Defined once in breakpoints.js and imported below -- see that file for
// why importing the numbers works even though native CSS can't put a
// custom property inside an @media condition.
//
// Why the left column is one CSS Grid instead of nested flexboxes: the
// Year/Role meta list item is the SAME element in the markup at every
// breakpoint, but which group it visually belongs to changes -- next to
// the outcome text on Mobile/Desktop, next to the tags on Tablet. A single
// slotted node can only live in one place in the DOM, so two separate flex
// containers can't both host it. Grid areas can relocate it purely in CSS
// (grid-template-areas differs per breakpoint) without moving anything in
// the DOM. Everything else in this file is the same flex-based approach as
// Tag/Divider/List item/Image -- this is the one spot that genuinely needs
// Grid, not a wholesale rebuild of the pattern.
//
// Slots:
//   tags         one or more <ds-tag> elements
//   header       the case study title (e.g. an <h3>, or bare text)
//   description  the short teaser under the title
//   outcome      the longer result/story text, under the divider
//   meta         a <ds-list-item> (e.g. year + role) -- see breakpoint
//                note above for where it renders
//   image        a <ds-image> with its <img>
//   descriptors  a <ds-list-item> of short tags under the image
//
// Usage:
//   <ds-card-case-study>
//     <ds-tag slot="tags" label="Enterprise"></ds-tag>
//     <ds-tag slot="tags" label="Data viz"></ds-tag>
//     <h3 slot="header">Case study title</h3>
//     <p slot="description">One-line teaser.</p>
//     <p slot="outcome">The fuller outcome and story.</p>
//     <ds-list-item slot="meta">
//       2019–2021
//       <span slot="item-2">Senior Product Designer</span>
//     </ds-list-item>
//     <ds-image slot="image">
//       <img src="cover.jpg" alt="…">
//     </ds-image>
//     <ds-list-item slot="descriptors">
//       B2B SaaS
//       <span slot="item-2">Healthcare</span>
//     </ds-list-item>
//   </ds-card-case-study>
//
// Loaded as an ES module (type="module") -- this file imports its own
// dependencies below, so a page only needs to load this one script;
// tag.js/divider.js/image.js/list-item.js don't need their own <script>
// tags too. This card's own shadow DOM only creates <ds-divider>
// elements directly, but every real usage also slots in <ds-tag>,
// <ds-image>, and <ds-list-item> -- importing all four here means one
// script tag is enough to get everything the card needs, instead of a
// page listing four separate tags in the right order.

import { QUERY_DESKTOP, QUERY_TABLET_ONLY } from "./breakpoints.js";
import "./tag.js";
import "./divider.js";
import "./image.js";
import "./list-item.js";

const CARD_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--size-space-600);
    width: 100%;
    min-width: 296px; /* Figma's Mobile card, auto-layout-hugged: 32px left
      padding + 240px content + 24px right padding. A defensive floor, same
      idea as ds-image's own min-height -- the card should never get squeezed
      narrower than its own design minimum even if a parent container tries. */
    background: var(--color-background-default-default);
    padding-block: var(--size-space-600);
    padding-left: var(--size-space-800);
    padding-right: var(--size-space-600);
    border-radius: 0 var(--size-radius-400) var(--size-radius-400) 0;
    box-shadow: var(--elevation-400);
    overflow: hidden;
    font-family: var(--typography-body-font-family), sans-serif;

    /* Reserves the hover accent's width up front (transparent, so it's
       invisible) instead of adding a border only on hover. Figma's hover
       state adds this border alongside the SAME left padding as default,
       which -- with box-sizing: border-box -- would shrink the content by
       8px the moment you hover. Reserving it always avoids that reflow. */
    border-left: var(--size-stroke-200) solid transparent;
    transition: box-shadow 150ms ease, border-left-color 150ms ease;
  }

  /* Reset the browser's default UA margin on slotted content. Without this,
     an <h3> (~44px top + bottom by default) or a <p> (~16px top + bottom)
     stacks its own margin on top of the spacing each slot below already
     controls via margin-bottom, roughly doubling every gap in the card and
     stopping the header/description/outcome text from hugging tightly the
     way Figma's own auto-layout does (Hug height, 0 padding). All spacing
     between sections should come from the slot rules, not from whatever
     element a consumer happens to slot in. */
  ::slotted(h1),
  ::slotted(h2),
  ::slotted(h3),
  ::slotted(h4),
  ::slotted(p) {
    margin: 0;
  }

  :host(:hover) {
    box-shadow: var(--elevation-550);
    border-left-color: var(--color-border-brand-default);
  }

  @media ${QUERY_DESKTOP} {
    :host {
      flex-direction: row;
    }
  }

  /* ---- left column: one grid, see file header for why ---- */

  .left {
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto 1fr auto;
    grid-template-areas:
      "tags"
      "header"
      "description"
      "divider"
      "outcome"
      "meta";
    min-width: 0;
  }

  @media ${QUERY_DESKTOP} {
    .left {
      flex: 0 1 360px; /* Figma's Desktop left column is a fixed 360px, but
        pinning it with flex: none + a fixed width would let it push past
        .right (and off the card) on the narrow end of Desktop, just above
        the 960px breakpoint. flex-grow: 0 caps it at 360px without letting
        it stretch wider; flex-shrink: 1 lets it give up width before
        .right does, since .right (image + descriptors) is where the
        available room actually needs to go. Vertical stretch to match
        .right's height still comes from :host's own align-items: stretch,
        independent of this flex-grow/shrink/basis value. */
    }
  }

  /* Tablet only: meta moves up next to tags. Outside this exact band,
     Mobile and Desktop share the same grouping (meta stays with outcome). */
  @media ${QUERY_TABLET_ONLY} {
    .left {
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto auto auto 1fr;
      grid-template-areas:
        "tags meta"
        "header header"
        "description description"
        "divider divider"
        "outcome outcome";
    }

    slot[name="tags"] {
      margin-bottom: 0;
    }

    slot[name="meta"] {
      justify-self: end;
    }

    slot[name="header"] {
      margin-top: var(--size-space-200); /* the tags→header gap moves here
        once tags shares its row with meta instead of sitting above header */
    }
  }

  slot[name="tags"] {
    grid-area: tags;
    display: flex;
    gap: var(--size-space-200);
    margin-bottom: var(--size-space-200);
  }

  slot[name="header"] {
    grid-area: header;
    display: block;
    margin-bottom: var(--size-space-400);
    font-family: var(--typography-heading-font-family), sans-serif;
    font-size: var(--typography-heading-header-size-3);
    line-height: var(--typography-heading-header-line-height-3);
    /* No font-weight token here on purpose -- FF Good Pro Wide only has
       one weight registered (500/Medium) in fonts.css, same reasoning
       Tag documents for its own font. */
    color: var(--color-text-default-default);
  }

  slot[name="description"] {
    grid-area: description;
    display: block;
    margin-bottom: var(--size-space-600);
    font-size: var(--typography-body-body-size-1);
    line-height: var(--typography-body-body-line-height-1);
    color: var(--color-text-default-default);
  }

  ds-divider[part="inner-divider"] {
    grid-area: divider;
    margin-bottom: var(--size-space-600);
  }

  slot[name="outcome"] {
    grid-area: outcome;
    box-sizing: border-box;
    display: block;
    padding-bottom: var(--size-space-1200); /* guaranteed minimum gap
      before meta, matching Figma at every breakpoint. On desktop this
      row is also 1fr (see .left above), so on a tall card the gap grows
      past this minimum and meta lands flush with the image's bottom
      edge instead -- exactly the space-between behavior Figma's own
      Desktop-only wrapper uses. */
    font-size: var(--typography-body-body-size-1);
    line-height: var(--typography-body-body-line-height-1);
    color: var(--color-text-default-default);
  }

  slot[name="meta"] {
    grid-area: meta;
    display: block;
  }

  /* ---- right column: image + descriptors, plain flex ---- */

  .right {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--size-space-200);
    min-width: 0;
    overflow: hidden;
  }

  @media ${QUERY_DESKTOP} {
    .right {
      flex: 1 0 0;
    }
  }

  slot[name="image"] {
    display: flex;
    flex: 1 0 0;
    /* No min-height: 0 here -- that would strip this flex item's natural
       content-based minimum, which is exactly what makes .right's own
       auto-height (on Tablet/Mobile, where .right isn't stretched to a
       definite height by the desktop row) actually include the image's
       real height instead of collapsing to ~0 and letting the image
       overflow past .right and get clipped by :host's overflow: hidden.
       ds-image now carries its own 300px min-height floor (see image.js),
       so removing this is safe on Desktop too: with .right stretched to a
       definite height there, the slot still flex-grows past 300px into
       whatever room is available. */
  }

  slot[name="descriptors"] {
    display: flex;
    flex-wrap: wrap;
    gap: var(--size-space-200);
  }
</style>
<div class="left">
  <slot name="tags"></slot>
  <slot name="header"></slot>
  <slot name="description"></slot>
  <ds-divider part="inner-divider"></ds-divider>
  <slot name="outcome"></slot>
  <slot name="meta"></slot>
</div>
<ds-divider part="divider"></ds-divider>
<div class="right">
  <slot name="image"></slot>
  <slot name="descriptors"></slot>
</div>
`;

class DsCardCaseStudy extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = CARD_TEMPLATE;
    this._outerDivider = root.querySelector('ds-divider[part="divider"]');

    // The outer divider's orientation is driven by viewport width, not an
    // author-set attribute -- vertical between the two columns on Desktop
    // (side by side), horizontal between them everywhere else (stacked).
    this._desktopQuery = matchMedia(QUERY_DESKTOP);
    this._syncDividerOrientation = this._syncDividerOrientation.bind(this);
  }

  connectedCallback() {
    this._syncDividerOrientation();
    this._desktopQuery.addEventListener("change", this._syncDividerOrientation);
  }

  disconnectedCallback() {
    this._desktopQuery.removeEventListener("change", this._syncDividerOrientation);
  }

  _syncDividerOrientation() {
    this._outerDivider.setAttribute("orientation", this._desktopQuery.matches ? "vertical" : "horizontal");
  }
}

customElements.define("ds-card-case-study", DsCardCaseStudy);
