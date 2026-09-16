// <ds-list-item> — List item web component
//
// Figma's "List"/"List Item" component (node 97:801), one unified element
// for every place the design system uses it -- the card's compact Year/Role
// and descriptor rows, and a case-study's numbered "how might we" points
// (self-service's Context section, node 222:3669). Same component, three
// independent attributes cover every variant Figma defines: a row of
// 1-4 short items, separated by <ds-divider>s. Every value comes from
// css/tokens.css custom properties, inherited through the shadow boundary
// -- no hardcoded colors, sizes, or heights here. The element hugs its
// content in both layouts; nothing is given a fixed height.
//
// Attributes:
//   layout    "row" | "stack"  (default: "row")
//             row:   items side by side, divided by vertical rules
//             stack: items stacked vertically, divided by horizontal rules
//   variant   "primary" | "secondary"  (default: "secondary") -- Figma's
//             "List style". secondary: body-size-2 (14px), Text/Default/
//             Secondary -- what the card's metadata rows use. primary:
//             body-size-1 (16px), Text/Default/Default -- what a
//             case-study's numbered points use.
//   numbered  boolean attribute. Shows a <ds-bubble-number> (neutral,
//             medium) before each visible item, numbered 1-4 to match its
//             slot -- Figma's "List Item" icon toggle. Off by default (the
//             card's rows don't use it).
//
// Slots:
//   (default)  item 1 — always shown
//   item-2     item 2 — optional; when present, a divider is inserted
//              automatically between item 1 and item 2
//   item-3     item 3 — optional, same rule, inserted between item 2 and 3
//   item-4     item 4 — optional, same rule, inserted between item 3 and 4
//
// Usage:
//   <ds-list-item>2019–2021</ds-list-item>
//
//   <ds-list-item>
//     2019–2021
//     <span slot="item-2">Senior Product Designer</span>
//   </ds-list-item>
//
//   <ds-list-item layout="stack">
//     IBM
//     <span slot="item-2">Staff Product Designer</span>
//     <span slot="item-3">Austin, TX</span>
//   </ds-list-item>
//
//   <ds-list-item layout="stack" variant="primary" numbered>
//     IAM platforms perform many functions and Self-service is a
//     foundational element.
//     <span slot="item-2">Out-of-the-box self-service experiences are
//       often limited in functionality and lag in usability.</span>
//     <span slot="item-3">Customers tend to build their own, but are left
//       with the burden of maintaining them.</span>
//     <span slot="item-4">The vision was to make the self-service
//       experience highly configurable and consumer grade.</span>
//   </ds-list-item>
//
// Loaded as an ES module (type="module") -- imports its own <ds-divider>
// and <ds-bubble-number> dependencies below, so a page only needs to load
// this one script.

import "./divider.js";
import "./bubble-number.js";

const LIST_ITEM_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* Row only, in effect: items hug their own width, but
      when the row runs out of room the overflowing item(s) drop to a new
      line as whole units (with their divider) instead of overflowing past
      the edge. Matches the Figma component's row Wrap setting. Harmless
      in stack mode too -- flex-wrap only matters on the axis items lay out
      across, which for a column is height, and items never overflow there
      the way they can across a row's width. */
    gap: var(--size-primitive-space-200);
    font-family: var(--typography-body-font-family), sans-serif;
    /* Secondary (default) -- Figma's "List style". Primary overrides below. */
    font-size: var(--typography-body-body-size-2);
    line-height: var(--typography-body-body-line-height-2);
    /* No token for font-weight here on purpose, same reasoning as Tag has
       for its own font: the Body/Font Weight token stores Figma's label
       ("Regular"), not a usable CSS value. Unlike Tag's Wide face though,
       FF Good Pro DOES have more than one weight registered in fonts.css
       (400 and 700), so the weight isn't incidental here -- set it
       explicitly to match the registered Regular face. */
    font-weight: 400;
    color: var(--color-text-default-secondary);
    white-space: nowrap; /* inherited through the shadow boundary, so this
      also reaches bare text slotted in with no wrapping element of its own.
      Row only -- stack overrides this below, since Figma's stack variant
      wraps each item's own text instead of letting it run past the edge. */
  }

  :host([variant="primary"]) {
    font-size: var(--typography-body-body-size-1);
    line-height: var(--typography-body-body-line-height-1);
    color: var(--color-text-default-default);
  }

  :host([layout="stack"]) {
    flex-direction: column;
    align-items: stretch; /* was flex-start: that hugged each item to its
      own content width (the same Hug behavior that let a long value run
      off the edge in Row, just on the stack axis instead). Stretch gives
      each item the full row width to wrap its text within, matching the
      Figma component's item now being Fill/w-full instead of Hug. */
  }

  :host([layout="stack"][variant="primary"]) {
    /* Figma's List component (node 101:994): Stack+Primary uses Space/400
       (16px) between items, not the 8px (Space/200) every other
       combination (Row, and Stack+Secondary) uses -- confirmed directly
       against the component's variant set, not a guess. Scoped to this
       exact combination only, since Row stays 8px even at Primary size. */
    gap: var(--size-primitive-space-400);
  }

  :host([layout="stack"]) slot {
    white-space: normal; /* un-does the row's nowrap so text already given
      a full width (from align-items: stretch above) can actually wrap. */
    min-width: 0; /* lets the slot shrink below its content's intrinsic
      width instead of forcing the host wider -- same idea as Figma's
      min-w-px on this item. */
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--size-primitive-space-200);
    min-width: 0; /* lets the slot below shrink/wrap in stack mode instead
      of this wrapper forcing the row wider. */
  }

  :host([layout="stack"]) .item {
    align-items: flex-start; /* the bubble number sits at the text's cap
      height, not vertically centered against however tall the wrapped
      text block ends up. */
  }

  .item slot {
    flex: 1 0 0;
  }

  /* The bubble number is only shown with the \`numbered\` attribute --
     Figma's "List Item" icon toggle, off by default. */
  .item-number {
    display: none;
    flex: none;
  }

  :host([numbered]) .item-number {
    display: inline-flex;
  }

  ds-divider {
    flex: none;
  }

  /* ds-divider's own :host([orientation=...]) rule sets display
     unconditionally, which otherwise beats the UA [hidden] rule (author
     styles win over UA styles regardless of specificity) -- !important
     here is what actually hides it when a slot has no content. */
  ds-divider[hidden] {
    display: none !important;
  }
</style>
<div class="item">
  <ds-bubble-number class="item-number" color="neutral" size="medium">1</ds-bubble-number>
  <slot></slot>
</div>
<ds-divider part="divider" hidden></ds-divider>
<div class="item">
  <ds-bubble-number class="item-number" color="neutral" size="medium">2</ds-bubble-number>
  <slot name="item-2"></slot>
</div>
<ds-divider part="divider" hidden></ds-divider>
<div class="item">
  <ds-bubble-number class="item-number" color="neutral" size="medium">3</ds-bubble-number>
  <slot name="item-3"></slot>
</div>
<ds-divider part="divider" hidden></ds-divider>
<div class="item">
  <ds-bubble-number class="item-number" color="neutral" size="medium">4</ds-bubble-number>
  <slot name="item-4"></slot>
</div>
`;

class DsListItem extends HTMLElement {
  static observedAttributes = ["layout"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = LIST_ITEM_TEMPLATE;
    this._dividers = root.querySelectorAll("ds-divider");
    this._itemSlots = {
      2: root.querySelector('slot[name="item-2"]'),
      3: root.querySelector('slot[name="item-3"]'),
      4: root.querySelector('slot[name="item-4"]'),
    };

    this._syncDividers = this._syncDividers.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute("layout")) this.setAttribute("layout", "row");
    if (!this.hasAttribute("variant")) this.setAttribute("variant", "secondary");

    this._syncOrientation();
    this._syncDividers();
    this._itemSlots[2].addEventListener("slotchange", this._syncDividers);
    this._itemSlots[3].addEventListener("slotchange", this._syncDividers);
    this._itemSlots[4].addEventListener("slotchange", this._syncDividers);
  }

  disconnectedCallback() {
    this._itemSlots[2].removeEventListener("slotchange", this._syncDividers);
    this._itemSlots[3].removeEventListener("slotchange", this._syncDividers);
    this._itemSlots[4].removeEventListener("slotchange", this._syncDividers);
  }

  attributeChangedCallback(name) {
    if (name === "layout") this._syncOrientation();
  }

  _syncOrientation() {
    // row (items side by side) -> vertical rules between them.
    // stack (items stacked) -> horizontal rules between them.
    const orientation = this.getAttribute("layout") === "stack" ? "horizontal" : "vertical";
    this._dividers.forEach((d) => d.setAttribute("orientation", orientation));
  }

  _syncDividers() {
    const has2 = this._itemSlots[2].assignedNodes({ flatten: true }).length > 0;
    const has3 = this._itemSlots[3].assignedNodes({ flatten: true }).length > 0;
    const has4 = this._itemSlots[4].assignedNodes({ flatten: true }).length > 0;
    this._dividers[0].hidden = !has2;
    this._dividers[1].hidden = !has3;
    this._dividers[2].hidden = !has4;
  }
}

customElements.define("ds-list-item", DsListItem);
