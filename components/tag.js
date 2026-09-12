// <ds-tag> — Tag web component
//
// Pulls every color/size/type value from css/tokens.css custom properties
// (via var() inside this component's own shadow-root <style>) — do not
// hardcode colors, sizes, or fonts here. Custom properties defined on the
// document (:root, in tokens.css) inherit through the shadow boundary, so
// tokens.css + fonts.css just need to be loaded once in the page; this
// component does not need to import them itself.
//
// Attributes:
//   scheme       "brand" | "danger" | "positive" | "warning" | "neutral"
//                (default: "neutral")
//   variant      "primary" | "secondary"  (default: "primary")
//   interactive  boolean attribute. Turns on hover/focus styling and click/
//                keyboard activation automatically — you never set a
//                separate "hover" state yourself. Off by default: a plain
//                <ds-tag> is a static label with no hover, not focusable.
//   dismissible  boolean attribute. Renders the X. The X is its own always-
//                clickable control, independent of `interactive`.
//
// Events (both bubble + cross shadow boundary):
//   ds-tag-click     fired on click / Enter / Space when `interactive` is set
//                    (not fired for clicks on the dismiss button)
//   ds-tag-dismiss   fired when the dismiss button is activated. The
//                    component does not remove/hide itself — the host page
//                    decides what happens (hide, remove, confirm, etc).
//
// Usage:
//   <ds-tag scheme="positive">Shipped</ds-tag>
//   <ds-tag scheme="danger" variant="secondary" dismissible>Blocked</ds-tag>
//   <ds-tag scheme="brand" interactive>Filter</ds-tag>

const TAG_TEMPLATE = /* html */ `
<style>
  :host {
    /* fallback tokens if scheme attribute isn't set yet — keeps the
       element from rendering unstyled before upgrade/attribute sync */
    --tag-bg: var(--color-background-neutral-default);
    --tag-bg-hover: var(--color-background-neutral-hover);
    --tag-fg: var(--color-text-neutral-on-neutral);
    --tag-icon: var(--color-icon-neutral-on-neutral);

    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--size-space-200);
    padding: var(--size-space-200);
    border-radius: var(--size-radius-200);
    background: var(--tag-bg);
    color: var(--tag-fg);
    font-family: var(--typography-button-font-family), sans-serif;
    font-size: var(--typography-button-size);
    line-height: var(--typography-button-size);
    /* No font-weight set on purpose, same reasoning as site-nav: FF Good Pro
       Wide only has one static face registered in fonts.css
       (FFGoodProWide-Medium.woff2) — there's nothing for a numeric weight
       to pick between, the look comes from which file loaded. */
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Scheme -> token map. Primary variant (the default) uses each scheme's
     Default/Hover + On-[Scheme] pair. */
  :host([scheme="brand"]) {
    --tag-bg: var(--color-background-brand-default);
    --tag-bg-hover: var(--color-background-brand-hover);
    --tag-fg: var(--color-text-brand-on-brand);
    --tag-icon: var(--color-icon-brand-on-brand);
  }
  :host([scheme="danger"]) {
    --tag-bg: var(--color-background-danger-default);
    --tag-bg-hover: var(--color-background-danger-hover);
    --tag-fg: var(--color-text-danger-on-danger);
    --tag-icon: var(--color-icon-danger-on-danger);
  }
  :host([scheme="positive"]) {
    --tag-bg: var(--color-background-positive-default);
    --tag-bg-hover: var(--color-background-positive-hover);
    --tag-fg: var(--color-text-positive-on-positive);
    --tag-icon: var(--color-icon-positive-on-positive);
  }
  :host([scheme="warning"]) {
    --tag-bg: var(--color-background-warning-default);
    --tag-bg-hover: var(--color-background-warning-hover);
    --tag-fg: var(--color-text-warning-on-warning);
    --tag-icon: var(--color-icon-warning-on-warning);
  }
  :host([scheme="neutral"]) {
    --tag-bg: var(--color-background-neutral-default);
    --tag-bg-hover: var(--color-background-neutral-hover);
    --tag-fg: var(--color-text-neutral-on-neutral);
    --tag-icon: var(--color-icon-neutral-on-neutral);
  }

  /* Secondary variant overrides — uses each scheme's Secondary/Secondary
     Hover + On-[Scheme]-Secondary pair. */
  :host([variant="secondary"][scheme="brand"]) {
    --tag-bg: var(--color-background-brand-secondary);
    --tag-bg-hover: var(--color-background-brand-secondary-hover);
    --tag-fg: var(--color-text-brand-on-brand-secondary);
    --tag-icon: var(--color-icon-brand-on-brand-secondary);
  }
  :host([variant="secondary"][scheme="danger"]) {
    --tag-bg: var(--color-background-danger-secondary);
    --tag-bg-hover: var(--color-background-danger-secondary-hover);
    --tag-fg: var(--color-text-danger-on-danger-secondary);
    --tag-icon: var(--color-icon-danger-on-danger-secondary);
  }
  :host([variant="secondary"][scheme="positive"]) {
    --tag-bg: var(--color-background-positive-secondary);
    --tag-bg-hover: var(--color-background-positive-secondary-hover);
    --tag-fg: var(--color-text-positive-on-positive-secondary);
    --tag-icon: var(--color-icon-positive-on-positive-secondary);
  }
  :host([variant="secondary"][scheme="warning"]) {
    --tag-bg: var(--color-background-warning-secondary);
    --tag-bg-hover: var(--color-background-warning-secondary-hover);
    --tag-fg: var(--color-text-warning-on-warning-secondary);
    --tag-icon: var(--color-icon-warning-on-warning-secondary);
  }
  :host([variant="secondary"][scheme="neutral"]) {
    --tag-bg: var(--color-background-neutral-secondary);
    --tag-bg-hover: var(--color-background-neutral-secondary-hover);
    --tag-fg: var(--color-text-neutral-on-neutral-secondary);
    --tag-icon: var(--color-icon-neutral-on-neutral-secondary);
  }

  /* Hover is never a state you set — it's implied by \`interactive\`. */
  :host([interactive]) {
    cursor: pointer;
  }
  :host([interactive]:hover),
  :host([interactive]:focus-visible) {
    background: var(--tag-bg-hover);
  }
  :host([interactive]:focus-visible) {
    outline: var(--size-stroke-focus-ring) solid var(--tag-fg);
    outline-offset: 2px;
  }

  .label {
    display: inline-block;
  }

  .dismiss {
    all: unset;
    display: none;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 16px;
    height: 16px;
    color: var(--tag-icon);
    cursor: pointer;
    border-radius: var(--size-radius-100);
  }
  :host([dismissible]) .dismiss {
    display: inline-flex;
  }
  .dismiss:hover,
  .dismiss:focus-visible {
    opacity: 0.7;
  }
  .dismiss:focus-visible {
    outline: var(--size-stroke-focus-ring) solid var(--tag-fg);
    outline-offset: 1px;
  }
  .dismiss svg {
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
  }
</style>
<span class="label" part="label"><slot></slot></span>
<button type="button" class="dismiss" part="dismiss" aria-label="Remove">
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
  </svg>
</button>
`;

class DsTag extends HTMLElement {
  static observedAttributes = ["interactive", "dismissible"];

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = TAG_TEMPLATE;
    this._dismissBtn = root.querySelector(".dismiss");
    this._slot = root.querySelector("slot");

    this._onHostClick = this._onHostClick.bind(this);
    this._onHostKeydown = this._onHostKeydown.bind(this);
    this._onDismissClick = this._onDismissClick.bind(this);
    this._syncDismissLabel = this._syncDismissLabel.bind(this);
  }

  connectedCallback() {
    if (!this.hasAttribute("scheme")) this.setAttribute("scheme", "neutral");
    if (!this.hasAttribute("variant")) this.setAttribute("variant", "primary");

    this._syncInteractive();
    this._syncDismissible();
    this._syncDismissLabel();

    this.addEventListener("click", this._onHostClick);
    this.addEventListener("keydown", this._onHostKeydown);
    this._dismissBtn.addEventListener("click", this._onDismissClick);
    this._slot.addEventListener("slotchange", this._syncDismissLabel);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._onHostClick);
    this.removeEventListener("keydown", this._onHostKeydown);
    this._dismissBtn.removeEventListener("click", this._onDismissClick);
    this._slot.removeEventListener("slotchange", this._syncDismissLabel);
  }

  attributeChangedCallback(name) {
    if (name === "interactive") this._syncInteractive();
    if (name === "dismissible") this._syncDismissible();
  }

  _syncInteractive() {
    const on = this.hasAttribute("interactive");
    if (on) {
      this.setAttribute("role", "button");
      this.setAttribute("tabindex", "0");
    } else {
      this.removeAttribute("role");
      this.removeAttribute("tabindex");
    }
  }

  _syncDismissible() {
    const on = this.hasAttribute("dismissible");
    this._dismissBtn.tabIndex = on ? 0 : -1;
  }

  _syncDismissLabel() {
    const label = this.textContent.trim() || "tag";
    this._dismissBtn.setAttribute("aria-label", `Remove ${label}`);
  }

  _onHostClick(e) {
    if (!this.hasAttribute("interactive")) return;
    if (e.target === this._dismissBtn || this._dismissBtn.contains(e.target)) return;
    this.dispatchEvent(new CustomEvent("ds-tag-click", { bubbles: true, composed: true }));
  }

  _onHostKeydown(e) {
    if (!this.hasAttribute("interactive")) return;
    if (e.target === this._dismissBtn) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.dispatchEvent(new CustomEvent("ds-tag-click", { bubbles: true, composed: true }));
    }
  }

  _onDismissClick(e) {
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("ds-tag-dismiss", { bubbles: true, composed: true }));
  }
}

customElements.define("ds-tag", DsTag);
