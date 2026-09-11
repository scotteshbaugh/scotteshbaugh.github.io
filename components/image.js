// <ds-image> — Image web component
//
// A reusable image frame: fills the width of its container, centers a
// slotted <img> inside a capped box (never shorter than 300px, never taller
// than 400px), and crops it to fill via object-fit: cover. Every number
// here is a raw pixel value straight from Figma, not a token -- these
// constraints (300/400/1000/10px, and the mobile height below) are specific
// to this one component's layout, not shared design values, so there's
// nothing in css/tokens.css to bind them to. Only the background
// placeholder color is a token.
//
// Needs a flex parent to size against (same as <ds-divider> needs a flex
// parent to stretch against) -- it flex-grows to fill whatever height is
// available. On narrow/mobile layouts it switches to a fixed 300px height
// instead of flexing, matching the Mobile card variant in Figma.
//
// Usage:
//   <ds-image>
//     <img src="cover.jpg" alt="Screenshot of the app dashboard">
//   </ds-image>

const IMAGE_TEMPLATE = /* html */ `
<style>
  :host {
    box-sizing: border-box;
    display: flex;
    flex: 1 0 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
    overflow: hidden;
    background: var(--color-background-brand-secondary);
  }

  /* Mobile override: a fixed height instead of flex-grow, since on narrow
     layouts the image sits above a stacked column rather than filling a
     fixed-height row. 480px is a plain breakpoint, not a token -- there's
     no breakpoint token defined yet (css/tokens.css's --responsive-* vars
     describe the current device, they aren't a set of thresholds). */
  @media (max-width: 480px) {
    :host {
      flex: none;
      height: 300px;
    }
  }

  .frame {
    box-sizing: border-box;
    display: flex;
    position: relative;
    flex: 1 0 0;
    height: 100%;
    max-height: 400px;
    max-width: 1000px;
    min-height: 300px;
    min-width: 0;
    align-items: center;
    justify-content: center;
    padding: 10px;
  }

  ::slotted(img) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: cover;
    pointer-events: none;
  }
</style>
<div class="frame" part="frame">
  <slot></slot>
</div>
`;

class DsImage extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = IMAGE_TEMPLATE;
  }
}

customElements.define("ds-image", DsImage);
