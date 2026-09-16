// <ds-summary> — Summary web component
//
// The "at a glance" key-fact grid for a case study: Goal / Outcome / Role /
// Client and scope, each a label + description pair. Every value comes from
// css/tokens.css custom properties, inherited through the shadow boundary --
// no hardcoded colors, sizes, or heights here.
//
// This is neither a list nor a card -- it's closer to a definition list
// (label + description pairs, no per-item border/shadow/container). See
// the Portfolio site project's figma/summary-custom-implementation.md doc
// for everything this deviates from the Figma "Summary" component.
//
// Why the four fields are fixed slots instead of a generic repeatable list:
// unlike ds-list-item (which holds 1-3 arbitrary short items), this
// component's fields are a fixed, named schema meant to stay consistent
// across every case study on the site -- Goal/Outcome/Role/Client and
// scope, always with those labels. The labels themselves live in this
// file, not in consumer markup, because they're part of the template, not
// per-instance content. Field ORDER differs by breakpoint (Outcome leads
// on Desktop; Goal leads on Tablet/Mobile) -- confirmed against Figma.
//
// Why CSS Grid with named grid-areas instead of flexbox + <ds-divider>
// elements (which is what the Figma component itself uses, and what the
// hand-authored version of this ran into trouble with): a divider inserted
// as a sibling between two fields has no identity of its own -- it can't
// "belong" to whichever fields end up adjacent to it once a breakpoint
// wraps 4 fields into 2 columns or 1. A 2x2 layout also needs a horizontal
// rule AND a vertical rule at the same time, which isn't something a single
// linear sequence of siblings-with-dividers can express cleanly no matter
// how it's reordered.
//
// The fix used here: each field is a grid item placed by name via
// grid-template-areas (same technique as the .left grid in
// card-case-study.js, which relocates its Year/Role meta item the same
// way), so reordering fields per breakpoint never touches the DOM.
//
// Divider lines: drawn as their own grid items (.summary-divider-1/2/3),
// not as borders on the fields. An earlier version drew each divider as a
// border owned by the field(s) next to it -- on Tablet's 2x2, that meant
// the vertical rule (owned by Outcome/Client and scope) and the horizontal
// rule (owned by Goal/Outcome) were two independently-positioned border
// segments that never actually touched, leaving a visible disconnected
// "elbow" at the crossing instead of a clean "+". A border can only run
// along the edge of the box that draws it -- it has no way to continue
// past that box into a neighboring gap.
//
// A single grid item doesn't have that limit: given its own row/column
// span, it paints one continuous rectangle across every track in that
// span, including gap tracks it merely passes through. So each divider
// here is sized to its own explicit gap track and then spans the *entire*
// grid in the perpendicular direction -- e.g. on Tablet, the vertical
// divider spans grid-row 1/4 (top to bottom, through the horizontal
// divider's row too), and the horizontal divider spans grid-column 1/4
// (left to right, through the vertical divider's column too). Both are
// centered to the divider's own thickness (--size-primitive-stroke-25)
// within their track, so they cross at the exact same point -- there's no
// seam because neither line is built from two segments in the first
// place.
//
// The gap track itself is sized to --gutter (a full
// --size-primitive-space-800 of clearance on *each* side of the hairline,
// not split between the two): centering a --size-primitive-stroke-25-wide
// divider inside a --gutter-wide track leaves exactly
// --size-primitive-space-800 of whitespace on both sides, which is what
// keeps a field's content the same distance from its neighbor as it was
// before there was a line there at all.
//
// Dividers are positioned by explicit grid line numbers, not named
// grid-areas like the fields: unlike the fields, a divider isn't tied to
// a piece of content that might reorder, so there's nothing for its
// identity to track -- it's the same 3 generic elements at every
// breakpoint, just re-pointed at different lines (and, on Tablet, given a
// different orientation) per media query.
//
// Breakpoints (imported from breakpoints.js, the site's real device
// breakpoints -- not arbitrary):
//   < 720px          Mobile   -- single column, stacked Goal, Outcome,
//                                 Role, Client and scope. Horizontal rule
//                                 between each
//   720px - 959px    Tablet   -- 2x2: Goal/Outcome on top, Role/Client and
//                                 scope below. Vertical rule between the
//                                 two columns, horizontal rule between the
//                                 two rows
//   >= 960px         Desktop  -- single row, Outcome first: Outcome,
//                                 Goal, Role, Client and scope. Vertical
//                                 rule between each. Outcome leads here
//                                 (unlike Tablet/Mobile) because Desktop
//                                 shows all 4 as one simultaneous row --
//                                 confirmed against Figma's Desktop
//                                 variant, not a leftover mismatch.
//
// Slots:
//   goal           the goal text
//   outcome        the outcome text
//   role           the role text
//   client-scope   the client-and-scope text
//
// Usage:
//   <ds-summary>
//     <span slot="goal">The capability needed to be configurable...</span>
//     <span slot="outcome">The platform now has a self-service...</span>
//     <span slot="role">I led the design for the Self-Service...</span>
//     <span slot="client-scope">The internal client for this project...</span>
//   </ds-summary>

import { QUERY_DESKTOP, QUERY_TABLET_ONLY } from "./breakpoints.js";

const SUMMARY_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: grid;
    width: 100%;
    max-width: var(--size-primitive-container-2000); /* 1600px, matches
      Figma's own cap on the Summary frame -- same value/token as
      case-study-title__heading's cap in case-study.css. */

    /* The gap track a divider sits in: a full --size-primitive-space-800
       of clearance on *each* side of the 1px hairline (not 32px split
       between the two -- see the file header comment). */
    --gutter: calc(2 * var(--size-primitive-space-800) + var(--size-primitive-stroke-25));

    /* Mobile (default): one column, fields stacked in reading order, each
       pair separated by its own gutter track rather than the \`gap\`
       property -- the divider elements below need a real track to be
       placed in. */
    grid-template-columns: 1fr;
    grid-template-rows:
      auto var(--gutter)
      auto var(--gutter)
      auto var(--gutter)
      auto;
    grid-template-areas:
      "goal"
      "."
      "outcome"
      "."
      "role"
      "."
      "client-scope";
  }

  @media ${QUERY_TABLET_ONLY} {
    :host {
      /* 2x2: Goal/Outcome paired above Role/Client and scope, so the
         goal->outcome (problem->result) pair reads as a unit before the
         supporting/credibility pair below it. The middle column/row are
         gutter tracks the two dividers below are placed into. */
      grid-template-columns: 1fr var(--gutter) 1fr;
      grid-template-rows: auto var(--gutter) auto;
      grid-template-areas:
        "goal . outcome"
        ".    . .       "
        "role . client-scope";
    }
  }

  @media ${QUERY_DESKTOP} {
    :host {
      /* Outcome leads on Desktop -- all 4 fields show as one simultaneous
         row here, unlike Tablet/Mobile's paired/stacked layouts. Every
         other column is a gutter track for one of the 3 vertical
         dividers. */
      grid-template-columns:
        1fr var(--gutter)
        1fr var(--gutter)
        1fr var(--gutter)
        1fr;
      grid-template-rows: auto;
      grid-template-areas: "outcome . goal . role . client-scope";
    }
  }

  .summary-item {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-width: var(--size-primitive-container-200); /* matches Figma's own
      min-w-[160px] on Summary Item directly -- at Desktop's 4-column
      layout that's 4x160 + 3x--gutter (65px) = 835px, comfortably under
      the 960px point the Desktop layout itself starts at, so unlike the
      old 240px value this no longer risks overflow/squeeze. */
    overflow-wrap: break-word; /* matches Figma's own word-break:break-word
      on Summary Item. */
  }

  .summary-item--goal          { grid-area: goal; }
  .summary-item--outcome       { grid-area: outcome; }
  .summary-item--role          { grid-area: role; }
  .summary-item--client-scope  { grid-area: client-scope; }

  /* ---- dividers: generic elements, positioned by grid line, re-pointed
     per breakpoint (see the file header comment for why this crosses
     cleanly where a border-per-field approach didn't) ---- */

  .summary-divider {
    background: var(--color-background-neutral-tertiary);
  }

  /* Mobile: 3 horizontal rules, one per gap row between the 4 stacked
     fields. Each spans the (single) column and sits centered in its row. */
  .summary-divider-1,
  .summary-divider-2,
  .summary-divider-3 {
    grid-column: 1 / 2;
    height: var(--size-primitive-stroke-25);
    align-self: center;
    justify-self: stretch;
  }

  .summary-divider-1 { grid-row: 2 / 3; }
  .summary-divider-2 { grid-row: 4 / 5; }
  .summary-divider-3 { grid-row: 6 / 7; }

  @media ${QUERY_TABLET_ONLY} {
    /* Tablet needs only 2 dividers (one cross): the 3rd is unused. */
    .summary-divider-3 {
      display: none;
    }

    /* Horizontal rule: spans every column (including the vertical
       divider's own column) so the two lines cross instead of meeting
       edge-to-edge. */
    .summary-divider-1 {
      grid-column: 1 / 4;
      grid-row: 2 / 3;
      height: var(--size-primitive-stroke-25);
      width: auto;
      align-self: center;
      justify-self: stretch;
    }

    /* Vertical rule: spans every row (including the horizontal divider's
       own row), for the same reason. */
    .summary-divider-2 {
      grid-column: 2 / 3;
      grid-row: 1 / 4;
      width: var(--size-primitive-stroke-25);
      height: auto;
      align-self: stretch;
      justify-self: center;
    }
  }

  @media ${QUERY_DESKTOP} {
    /* Desktop: 3 vertical rules, one per gap column between the 4 fields
       in a single row. Each spans the (single) row and sits centered in
       its column. */
    .summary-divider-1,
    .summary-divider-2,
    .summary-divider-3 {
      grid-row: 1 / 2;
      width: var(--size-primitive-stroke-25);
      height: auto;
      align-self: stretch;
      justify-self: center;
    }

    .summary-divider-1 { grid-column: 2 / 3; }
    .summary-divider-2 { grid-column: 4 / 5; }
    .summary-divider-3 { grid-column: 6 / 7; }
  }

  /* ---- label + description text ---- */

  .summary-item__label {
    display: block;
    font-family: var(--typography-heading-font-family), sans-serif;
    font-size: var(--typography-heading-header-size-6);
    line-height: var(--typography-heading-header-line-height-6);
    /* No font-weight token here on purpose -- FF Good Pro Wide only has
       one weight registered (500/Medium) in fonts.css, same reasoning
       Tag and the card's header slot document for themselves. */
    color: var(--color-text-default-default);
  }

  ::slotted(*) {
    display: block;
    margin: 0;
    font-family: var(--typography-body-font-family), sans-serif;
    font-size: var(--typography-body-body-size-1);
    /* Figma pairs body-size-1 with body-line-height-2, not body-size-1's
       own default line-height-1 -- an intentional, tighter override for
       this component, not a typo. */
    line-height: var(--typography-body-body-line-height-2);
    font-weight: 400; /* explicit: FF Good Pro (Regular) has both 400 and
      700 registered in fonts.css, unlike the Wide face used for labels. */
    color: var(--color-text-default-secondary);
  }
</style>
<div class="summary-item summary-item--goal">
  <span class="summary-item__label">Goal</span>
  <slot name="goal"></slot>
</div>
<div class="summary-item summary-item--outcome">
  <span class="summary-item__label">Outcome</span>
  <slot name="outcome"></slot>
</div>
<div class="summary-item summary-item--role">
  <span class="summary-item__label">Role</span>
  <slot name="role"></slot>
</div>
<div class="summary-item summary-item--client-scope">
  <span class="summary-item__label">Client and scope</span>
  <slot name="client-scope"></slot>
</div>
<div class="summary-divider summary-divider-1" aria-hidden="true"></div>
<div class="summary-divider summary-divider-2" aria-hidden="true"></div>
<div class="summary-divider summary-divider-3" aria-hidden="true"></div>
`;

class DsSummary extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = SUMMARY_TEMPLATE;
  }
}

customElements.define("ds-summary", DsSummary);
