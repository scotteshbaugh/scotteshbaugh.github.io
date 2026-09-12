// <ds-list-item> — List item web component
//
// A row of 1–3 short text items separated by <ds-divider>s. Every value
// comes from css/tokens.css custom properties, inherited through the shadow
// boundary — no hardcoded colors, sizes, or heights here. The element hugs
// its content in both layouts; nothing is given a fixed height.
//
// Attributes:
//   layout   "row" | "stack"  (default: "row")
//            row:   items side by side, divided by vertical rules
//            stack: items stacked vertically, divided by horizontal rules
//
// Slots:
//   (default)  item 1 — always shown
//   item-2     item 2 — optional; when present, a divider is inserted
//              automatically between item 1 and item 2
//   item-3     item 3 — optional, same rule, inserted between item 2 and 3
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
// Loaded as an ES module (type="module") -- imports its own <ds-divider>
// dependency below, so a page only needs to load this one script.

import "./divider.js";

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
    gap: var(--size-space-200);
    font-family: var(--typography-body-font-family), sans-serif;
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

  :host([layout="stack"]) {
    flex-direction: column;
    align-items: stretch; /* was flex-start: that hugged each item to its
      own content width (the same Hug behavior that let a long value run
      off the edge in Row, just on the stack axis instead). Stretch gives
      each item the full row width to wrap its text within, matching the
      Figma component's item now being Fill/w-full instead of Hug. */
  }

  :host([layout="stack"]) slot {
    white-space: normal; /* un-does the row's nowrap so text already given
      a full width (from align-items: stretch above) can actually wrap. */
    min-width: 0; /* lets the slot shrink below its content's intrinsic
      width instead of forcing the host wider -- same idea as Figma's
      min-w-px on this item. */
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
<slot></slot>
<ds-divider part="divider" hidden></ds-divider>
<slot name="item-2"></slot>
<ds-divider part="divider" hidden></ds-divider>
<slot name="item-3"></slot>
`;

class DsListItem extends HTMLElement {
  static observedAttributes = ["layout"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = LIST_ITEM_TEMPLATE;
    this._dividers = root.querySelectorAll("ds-divider");
    this._item2Slot = root.querySelector('slot[name="item-2"]');
    this._item3Slot = root.querySelector('slot[name="item-3"]');

    this._syncDividers = this._syncDividers.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute("layout")) this.setAttribute("layout", "row");

    this._syncOrientation();
    this._syncDividers();
    this._item2Slot.addEventListener("slotchange", this._syncDividers);
    this._item3Slot.addEventListener("slotchange", this._syncDividers);
  }

  disconnectedCallback() {
    this._item2Slot.removeEventListener("slotchange", this._syncDividers);
    this._item3Slot.removeEventListener("slotchange", this._syncDividers);
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
    const has2 = this._item2Slot.assignedNodes({ flatten: true }).length > 0;
    const has3 = this._item3Slot.assignedNodes({ flatten: true }).length > 0;
    this._dividers[0].hidden = !has2;
    this._dividers[1].hidden = !has3;
  }
}

customElements.define("ds-list-item", DsListItem);
