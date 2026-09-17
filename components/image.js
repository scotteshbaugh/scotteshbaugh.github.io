// <ds-image> — Image web component
//
// The image surface primitive (Figma "Image", node 270:1637). It draws the
// frame around a slotted <img>; what that frame looks like depends on where
// the image sits, which is what the `placement` attribute says -- Figma's
// own "Placement" property on the same component.
//
// This is the piece <ds-card-image> and <ds-lightbox> are both built out of,
// matching how Figma nests an Image instance inside each of them rather than
// redrawing the surface twice. Change the surface here and both pick it up.
//
// Attribute:
//   placement   "standalone" | "card" | "lightbox"  (default: "standalone")
//
//     standalone  Its own surface: radius + elevation 400, stepping to
//                 elevation 550 on hover. The plain "here is a picture of
//                 the work" case, and the only placement Figma defines a
//                 State=Hover variant for -- see the hover note below.
//     card        Background only. No radius, no shadow: <ds-card-image>
//                 draws the framing around it, and a second radius/shadow
//                 inside that one would read as a box within a box.
//     lightbox    Elevation 550, but still no radius (deliberate, confirmed
//                 against the Lightbox design -- the lightbox shows the
//                 image square-cornered). The scrim behind it is blur +
//                 a translucent wash rather than a dim layer, so this
//                 shadow is the only thing separating image from page.
//
// Why hover is standalone-only: Figma defines State=Hover for Placement=
// Standalone alone. Card and Lightbox each sit inside a parent that owns
// its own interaction, so a lift here would be a second, competing
// affordance pointing at the same click.
//
// Sizing: the image's own aspect ratio drives the box -- the component
// hugs whatever is slotted into it, with no caps, floors or fixed ratio of
// its own. The one exception is placement="card", which keeps object-fit:
// cover: <ds-card-image> gives it a fixed-height row to fill, and the five
// case-study covers don't share an aspect ratio, so without the crop they
// would letterbox against the brand bleed at five different heights.
// Figma can't express that distinction (it has no <img> to fit), so it
// lives here.
//
// Every value is a token from css/tokens.css, inherited through the shadow
// boundary -- no hardcoded colors, radii, shadows or sizes.
//
// Usage:
//   <ds-image>
//     <img src="work.png" alt="The settings screen, mid-edit">
//   </ds-image>
//
//   <ds-image placement="lightbox">
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

  /* Standalone owns its surface: the rounded, raised "here is a picture"
     treatment. Card and Lightbox deliberately omit the radius -- see the
     file header. */
  :host([placement="standalone"]) {
    border-radius: var(--size-primitive-radius-400);
    box-shadow: var(--elevation-400);
  }

  :host([placement="standalone"]:hover) {
    box-shadow: var(--elevation-550);
  }

  :host([placement="lightbox"]) {
    box-shadow: var(--elevation-550);
  }

  /* Card is a flex child of <ds-card-image>, which sets its own caps and
     floor on this element from the outside. flex/min-width live here rather
     than there so the element is a well-behaved flex item wherever it is
     put, and min-width: 0 stops the usual flex "won't shrink below its
     content" floor from defeating the parent's max-width. */
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

  /* The crop that only the card needs -- see the sizing note in the file
     header for why this is the one placement that fills rather than hugs. */
  :host([placement="card"]) ::slotted(img) {
    height: 100%;
    object-fit: cover;
    object-position: center;
  }
</style>
<slot></slot>
`;

class DsImage extends HTMLElement {
  connectedCallback() {
    // Reflected as a real attribute rather than kept as a property, because
    // every rule above is an attribute selector on the host -- same pattern
    // as <ds-callout>'s own type attribute.
    if (!this.hasAttribute("placement")) this.setAttribute("placement", "standalone");

    if (!this.shadowRoot) {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = IMAGE_TEMPLATE;
    }
  }
}

customElements.define("ds-image", DsImage);
