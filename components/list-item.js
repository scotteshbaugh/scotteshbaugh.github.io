// <ds-list-item> — List Item web component
//
// One item in a list (Figma "List Item", node 219:1130): its text, an
// optional number in front of it, and the rule that separates it from the
// item before it. Nothing else -- the item doesn't know how many siblings
// it has or which way they run. <ds-list> owns all of that and sets these
// attributes on each item it holds.
//
// The rule lives here rather than between items in <ds-list> because a
// list's items are slotted light-DOM children: a component can't place
// its own elements between the children it is given. Drawing the leading
// rule inside each item (all but the first) puts it in the right place
// with the right orientation, and keeps <ds-divider> as the one thing
// that draws a rule anywhere in this system.
//
// Attributes (all normally set by <ds-list>, not by hand):
//   variant   "primary" | "secondary"  (default: "secondary")
//             Figma's "Item style". secondary: Body 2, Text/Default/
//             Secondary -- the card's metadata rows. primary: Body 1,
//             Text/Default/Default -- a case study's points.
//   layout    "row" | "stack"  (default: "row") -- which way the list
//             runs, so the leading rule knows to be vertical or
//             horizontal and the text knows whether to wrap.
//   number    an integer. Shows a <ds-bubble-number> before the text.
//   divided   boolean. Draws the leading rule. <ds-list> sets it on every
//             item except the first.
//
// Usage (on its own -- a single item with no list around it):
//   <ds-list-item variant="primary">2019–2021</ds-list-item>
//
// Every value comes from css/tokens.css, inherited through the shadow
// boundary. The gap between the rule and the text comes from the list, as
// --ds-list-gap, so the space above and below a rule always matches.

import "./divider.js";
import "./bubble-number.js";

const LIST_ITEM_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-width: 0;
    /* Matches the list's own gap, so a rule sits the same distance from
       the item before it as from its own text. */
    gap: var(--ds-list-gap, var(--size-primitive-space-200));
    font-family: var(--typography-body-font-family), sans-serif;
    /* Secondary (default) -- Figma's "Item style". Primary overrides below. */
    font-size: var(--typography-body-body-size-2);
    line-height: var(--typography-body-body-line-height-2);
    /* No token for font-weight on purpose: the Body/Font Weight token
       stores Figma's label ("Regular"), not a usable CSS value, and
       FF Good Pro has both 400 and 700 registered in fonts.css. */
    font-weight: 400;
    color: var(--color-text-default-secondary);
    /* Row only -- stack overrides this below. Inherited through the
       shadow boundary, so it also reaches bare text slotted in with no
       wrapping element of its own. */
    white-space: nowrap;
  }

  :host([variant="primary"]) {
    font-size: var(--typography-body-body-size-1);
    line-height: var(--typography-body-body-line-height-1);
    color: var(--color-text-default-default);
  }

  /* Stacked: the rule sits above the item, and the text wraps inside the
     width it's given instead of running past the edge. */
  :host([layout="stack"]) {
    flex-direction: column;
    align-items: stretch;
    white-space: normal;
  }

  .content {
    display: flex;
    align-items: center;
    gap: var(--size-primitive-space-200);
    min-width: 0;
  }

  /* The number sits at the text's cap height, not centered against a
     wrapped block of text. */
  :host([layout="stack"]) .content {
    align-items: flex-start;
  }

  .content slot {
    flex: 1 0 0;
    min-width: 0;
  }

  .number,
  .rule {
    flex: none;
  }

  /* ds-divider's own :host([orientation]) rule sets display
     unconditionally, which otherwise beats the UA [hidden] rule (author
     styles win over UA styles regardless of specificity). */
  [hidden] {
    display: none !important;
  }
</style>
<ds-divider class="rule" part="rule" hidden></ds-divider>
<div class="content">
  <ds-bubble-number class="number" part="number" color="neutral" size="medium" hidden></ds-bubble-number>
  <slot></slot>
</div>
`;

class DsListItem extends HTMLElement {
  static observedAttributes = ["layout", "number", "divided"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = LIST_ITEM_TEMPLATE;
    this._rule = root.querySelector(".rule");
    this._number = root.querySelector(".number");
  }

  connectedCallback() {
    if (!this.hasAttribute("variant")) this.setAttribute("variant", "secondary");
    if (!this.hasAttribute("layout")) this.setAttribute("layout", "row");
    this.#sync();
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    if (!this._rule) return;
    // row (items side by side) -> vertical rules. stack -> horizontal.
    this._rule.setAttribute("orientation", this.getAttribute("layout") === "stack" ? "horizontal" : "vertical");
    this._rule.hidden = !this.hasAttribute("divided");

    const number = this.getAttribute("number");
    this._number.hidden = number === null;
    if (number !== null) this._number.textContent = number;
  }
}

customElements.define("ds-list-item", DsListItem);
