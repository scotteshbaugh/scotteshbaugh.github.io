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
// Crop anchor: above 1000px wide, the frame is capped and centered, with
// the purple background showing on both sides -- the image crops evenly
// from both sides too. At 1000px and narrower, the frame is flush with the
// host (no more purple gap), and the crop switches to left-anchored, so it
// only eats into the right side of the image as it keeps narrowing. This
// uses a container query on the host's own width, not the viewport --
// it's about how much room THIS component has, not how wide the page is.
//
// Needs a flex parent to size against (same as <ds-divider> needs a flex
// parent to stretch against) -- it flex-grows to fill whatever height is
// available. A 300px min-height is a real, unconditional floor (matching
// .frame's own min-height below) rather than a breakpoint-scoped override,
// because flex-grow alone doesn't guarantee any height: inside a flex
// container whose own height isn't definite (e.g. a stacked column with no
// fixed height), "flex: 1 0 0" resolves to the item's floor, and without a
// real min-height that floor is 0 -- collapsing the whole component
// invisibly, with overflow: hidden clipping away .frame's inner 300px too.
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
    min-height: 300px; /* a real floor, not just a fallback -- see file
      header. Matches .frame's own min-height below, so the component never
      collapses even when its flex parent has no definite height to grow
      into (e.g. Card's stacked mobile/tablet column). */
    overflow: hidden;
    background: var(--color-background-brand-secondary);
    container-type: inline-size;
    container-name: ds-image;
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
    object-position: center;
    pointer-events: none;
  }

  /* Once the host is <= 1000px wide, .frame is no longer capped -- it's
     flush with the host, so the purple background gaps are gone. At that
     point stop cropping evenly from both sides: anchor left and let the
     crop eat only from the right as it keeps narrowing. Above 1000px the
     frame stays centered inside the host with its own even crop. */
  @container ds-image (max-width: 1000px) {
    ::slotted(img) {
      object-position: left center;
    }
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
