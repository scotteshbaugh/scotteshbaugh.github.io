// <ds-lightbox> — Light Box web component
//
// The full-screen overlay a standalone image opens into (Figma "Light Box",
// node 277:58473). Like <ds-card-image>, it draws no image surface of its
// own: it nests a <ds-image placement="lightbox"> and contributes the scrim
// it sits on plus the close button.
//
// -- Built on <dialog> --
// The markup underneath is a real <dialog> opened with showModal(), which
// is what supplies the behaviour a lightbox needs and is easy to get wrong
// by hand: Escape closes it, focus is trapped inside while open and
// returned to whatever opened it on close, the rest of the page goes inert
// to both tab order and screen readers, and it renders in the top layer so
// no z-index or ancestor overflow can clip it. Consumers never see the
// dialog; it is an implementation detail of this element.
//
// The one thing showModal() does NOT do is stop the page behind from
// scrolling, so that is handled here.
//
// -- The scrim is the dialog, not ::backdrop --
// Figma models the scrim as a fill and a background blur on the Light Box
// frame itself, so the dialog carries them and ::backdrop is left
// transparent. That also makes "click outside to close" honest: the dialog
// element is the scrim, so a click whose target is the dialog itself landed
// on empty space, while a click on the image or the button does not.
//
// Figma's background blur is 4, but a Figma background blur renders at
// roughly twice the radius of the CSS backdrop-filter that matches it --
// Figma's own code output halves it too. The halving lives here rather than
// in the token because --overlay-scrim-blur aliases Blur/100, the same
// primitive the elevation shadows use for box-shadow blur, where no such
// conversion applies.
//
// -- What Figma cannot say --
// Figma draws the image at its natural size on a 1894x1080 frame. A real
// screenshot has to fit whatever viewport it lands in, so the image is
// capped here. The cap reuses Space/800 -- the same inset the close button
// sits at -- so the image stops where the close button's margin begins,
// rather than at some number invented for the purpose.
//
// Attributes:
//   open   present while the lightbox is showing. Setting or removing it
//          opens and closes; so do show() and close().
//
// Events:
//   ds-lightbox-close   dispatched on the host after it closes, however it
//                       was dismissed (button, Escape, or the scrim).
//
// Usage:
//   <ds-lightbox>
//     <img src="work.png" alt="The settings screen, mid-edit">
//   </ds-lightbox>
//
//   lightbox.show();

import { nestImage } from "./nest-image.js";
import "./icon-button.js";

const LIGHTBOX_TEMPLATE = /* html */ `
<style>
  :host {
    display: contents;
  }

  .scrim {
    /* Reset the UA's own dialog styling before building on it. */
    margin: 0;
    padding: 0;
    border: 0;
    max-width: none;
    max-height: none;

    box-sizing: border-box;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    background: var(--overlay-scrim-color);
    /* See the blur note in the file header for the /2 -- it is a
       Figma-to-browser conversion, not a design value. */
    -webkit-backdrop-filter: blur(calc(var(--overlay-scrim-blur) / 2));
    backdrop-filter: blur(calc(var(--overlay-scrim-blur) / 2));
  }

  .scrim:not([open]) {
    display: none;
  }

  /* The scrim is painted on the dialog itself (see header), so the real
     backdrop stays out of the way. */
  .scrim::backdrop {
    background: transparent;
  }

  /* Caps the image so it fits the viewport, stopping where the close
     button's inset begins -- Figma has no way to express this. */
  ::slotted(ds-image) {
    max-width: calc(100vw - (2 * var(--size-primitive-space-800)));
    max-height: calc(100vh - (2 * var(--size-primitive-space-800)));
  }

  .close {
    position: absolute;
    top: var(--size-primitive-space-800);
    right: var(--size-primitive-space-800);
  }
</style>
<dialog class="scrim" part="scrim">
  <ds-icon-button class="close" part="close" variant="primary" size="medium"
                  icon="x" label="Close"></ds-icon-button>
  <slot></slot>
</dialog>
`;

class DsLightbox extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  connectedCallback() {
    nestImage(this, "lightbox");

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = LIGHTBOX_TEMPLATE;

      this._dialog = root.querySelector(".scrim");

      // A click that lands on the dialog itself was a click on empty scrim;
      // one on the image or the button has those as its target instead.
      this._dialog.addEventListener("click", (e) => {
        if (e.target === this._dialog) this.close();
      });

      root.querySelector(".close").addEventListener("click", () => this.close());

      // Escape triggers the dialog's own cancel; let it through but route
      // the state back through this element so `open` stays truthful.
      this._dialog.addEventListener("cancel", (e) => {
        e.preventDefault();
        this.close();
      });
    }

    if (this.hasAttribute("open")) this._sync();
  }

  disconnectedCallback() {
    this._unlockScroll();
  }

  attributeChangedCallback(attr, oldValue, newValue) {
    if (oldValue === newValue || !this.shadowRoot) return;
    this._sync();
  }

  get open() {
    return this.hasAttribute("open");
  }

  set open(value) {
    if (value) this.setAttribute("open", "");
    else this.removeAttribute("open");
  }

  show() {
    this.open = true;
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent("ds-lightbox-close", { bubbles: true, composed: true }));
  }

  _sync() {
    const dialog = this._dialog;
    if (!dialog) return;

    if (this.open) {
      if (!dialog.open) dialog.showModal();
      this._lockScroll();
    } else {
      if (dialog.open) dialog.close();
      this._unlockScroll();
    }
  }

  // showModal() makes the page behind inert but does not stop it scrolling.
  _lockScroll() {
    if (this._lockedOverflow !== undefined) return;
    this._lockedOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }

  _unlockScroll() {
    if (this._lockedOverflow === undefined) return;
    document.documentElement.style.overflow = this._lockedOverflow;
    this._lockedOverflow = undefined;
  }
}

customElements.define("ds-lightbox", DsLightbox);
