// <ds-list> — List web component
//
// A list of <ds-list-item>s with rules between them (Figma "List", node
// 101:994). The list owns everything about the set: which way it runs,
// which style its items use, whether the items are numbered, and the
// space between them. Each item owns only its own text (see
// components/list-item.js).
//
// Figma keeps these as two components for the same reason: List Item is
// the text, List is that text repeated, divided and arranged. Bosco:
// "List item is literally just the list text. List is that with dividers
// and can be multiples."
//
// Attributes:
//   layout    "row" | "stack"  (default: "row")
//             row:   items side by side, separated by vertical rules,
//                    wrapping as whole units when the row runs out of room
//             stack: items stacked, separated by horizontal rules
//   variant   "primary" | "secondary"  (default: "secondary")
//             Passed down to every item -- Figma's "List style".
//   numbered  boolean. Numbers every item in order, 1, 2, 3...
//             Counted from the items present, so adding or removing one
//             renumbers the rest.
//
// Any number of items: unlike the element this replaced, there is no cap.
//
// Usage:
//   <ds-list>
//     <ds-list-item>2019–2021</ds-list-item>
//     <ds-list-item>Senior Product Designer</ds-list-item>
//   </ds-list>
//
//   <ds-list layout="stack" variant="primary" numbered>
//     <ds-list-item>IAM platforms perform many functions...</ds-list-item>
//     <ds-list-item>Out-of-the-box experiences lag in usability.</ds-list-item>
//   </ds-list>
//
// Loaded as an ES module: it imports <ds-list-item>, which in turn imports
// <ds-divider> and <ds-bubble-number>, so a page only needs this one script.

import "./list-item.js";

const LIST_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    /* Row: an item that doesn't fit drops to a new line as a whole unit,
       with its rule -- Figma's row Wrap setting. */
    flex-wrap: wrap;
    /* Read by every item too (it inherits), so the space above and below
       a rule matches the space between items. */
    --ds-list-gap: var(--size-primitive-space-200);
    gap: var(--ds-list-gap);
  }

  :host([layout="stack"]) {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
  }

  /* Figma's List: Stack + Primary is the one combination that uses
     Space/400 (16px) between items. Row and Stack + Secondary stay at
     Space/200 (8px). */
  :host([layout="stack"][variant="primary"]) {
    --ds-list-gap: var(--size-primitive-space-400);
  }
</style>
<slot></slot>
`;

class DsList extends HTMLElement {
  static observedAttributes = ["layout", "variant", "numbered"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = LIST_TEMPLATE;
    this._slot = root.querySelector("slot");
    this._onSlotChange = () => this.#sync();
  }

  connectedCallback() {
    if (!this.hasAttribute("layout")) this.setAttribute("layout", "row");
    if (!this.hasAttribute("variant")) this.setAttribute("variant", "secondary");

    // slotchange covers items added or removed after the list is in the
    // page (every page here fills its lists from JSON after load).
    this._slot.addEventListener("slotchange", this._onSlotChange);
    this.#sync();
  }

  disconnectedCallback() {
    this._slot.removeEventListener("slotchange", this._onSlotChange);
  }

  attributeChangedCallback() {
    this.#sync();
  }

  #sync() {
    const items = [...this.children].filter((el) => el.tagName === "DS-LIST-ITEM");
    const layout = this.getAttribute("layout") ?? "row";
    const variant = this.getAttribute("variant") ?? "secondary";
    const numbered = this.hasAttribute("numbered");

    items.forEach((item, i) => {
      item.setAttribute("layout", layout);
      item.setAttribute("variant", variant);
      // Every item but the first draws the rule that separates it from
      // the one before it.
      if (i === 0) item.removeAttribute("divided");
      else item.setAttribute("divided", "");
      if (numbered) item.setAttribute("number", String(i + 1));
      else item.removeAttribute("number");
    });
  }
}

customElements.define("ds-list", DsList);
