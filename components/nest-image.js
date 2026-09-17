// nestImage() — shared helper for the components that wrap <ds-image>.
//
// Both <ds-card-image> and <ds-lightbox> are, in Figma, a frame with an
// Image instance inside it. The natural way to express that in a web
// component would be to put <ds-image><slot></slot></ds-image> in the
// wrapper's shadow root -- but that quietly breaks <ds-image>'s own
// styling. ::slotted() matches a slot's *directly assigned* nodes, and
// when a <slot> element is itself what gets assigned, ds-image's
// ::slotted(img) rules match the <slot>, not the <img> inside it, so the
// image ends up unstyled (no width, and no object-fit for the card crop).
//
// So the nesting happens in light DOM instead: this moves the wrapper's
// own children into a <ds-image> element and puts that back in their
// place, leaving the <img> a real child of a real <ds-image>, which makes
// ::slotted(img) match the way it does anywhere else.
//
// What consumers write stays flat either way:
//
//   <ds-card-image>
//     <img src="cover.jpg" alt="...">
//   </ds-card-image>
//
// It's idempotent -- a consumer that writes the <ds-image> themselves
// (or a component that gets disconnected and reconnected, which runs
// connectedCallback again) is left alone rather than wrapped twice.

import "./image.js";

export function nestImage(host, placement) {
  const existing = host.querySelector(":scope > ds-image");
  if (existing) {
    existing.setAttribute("placement", placement);
    return existing;
  }

  const image = document.createElement("ds-image");
  image.setAttribute("placement", placement);
  image.append(...host.childNodes);
  host.append(image);
  return image;
}
