// <ds-image> — Image web component
//
// Behavior only. <ds-image> is the thing that holds a picture; it no longer
// draws a surface of its own. The corners, Separation shadow and radial
// backdrop that used to live on placement="standalone" moved to the
// Showcase pattern (css/case-study.css), which is where Figma puts them
// too: Figma's Image component (node 389:27096) is an empty Fill/Fill frame
// with a Background/Default/Secondary fill and nothing else.
//
// What it does:
//   - Warns in the console when the slotted <img> has no alt attribute.
//     alt="" is allowed (a decorative image says so on purpose); a missing
//     alt is always a mistake.
//   - Sets loading="lazy" on the slotted <img> unless the markup already
//     chose (loading="eager" for anything above the fold).
//   - Hugs the image: width fills the parent, height follows the picture's
//     own aspect ratio. No fixed ratio, no caps.
//   - Shows Background/Default/Secondary while the file loads.
//
// Attribute:
//   placement   (none) | "card" | "lightbox"
//
//     (none)    The default. Hugs its image, no surface. Put it inside a
//               .showcase or .showcase__panel for the framed look.
//     card      Crops to fill: <ds-card-image> gives it a fixed-height row,
//               and the five covers don't share an aspect ratio, so without
//               object-fit: cover they would letterbox at five heights.
//     lightbox  Kept until the lightbox rework (it will show a Showcase
//               larger). Same as the default for now.
//
// Usage:
//   <ds-image>
//     <img src="work.png" alt="The settings screen, mid-edit">
//   </ds-image>

const IMAGE_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: block;
    overflow: hidden;
    background: var(--color-background-default-secondary);
  }

  /* Card is a flex child of <ds-card-image>, which sets its own caps and
     floor on this element from the outside. min-width: 0 stops the flex
     "won't shrink below its content" floor from defeating that max-width. */
  :host([placement="card"]) {
    display: flex;
    flex: 1 0 0;
    min-width: 0;
  }

  ::slotted(img) {
    display: block;
    width: 100%;
    height: auto;
  }

  :host([placement="card"]) ::slotted(img) {
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
</style>
<slot></slot>
`;

class DsImage extends HTMLElement {
  #warned = null;

  connectedCallback() {
    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = IMAGE_TEMPLATE;
      root.querySelector("slot").addEventListener("slotchange", () => this.#check());
    }
    this.#check();
  }

  #check() {
    const img = this.querySelector("img");
    if (!img) return;
    if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    if (!img.hasAttribute("alt") && this.#warned !== img) {
      this.#warned = img; // once per <img>, not once per slotchange
      console.warn(`<ds-image>: <img src="${img.getAttribute("src") ?? ""}"> has no alt -- describe the picture, or use alt="" if it's decorative`);
    }
  }
}

customElements.define("ds-image", DsImage);
