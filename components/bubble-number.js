// <ds-bubble-number> — Bubble Number web component
//
// Figma: "Bubble Number" component set (node 34:1277). A flat, solid-color
// circle with a centered number — no icon/SVG involved, so this is built as
// plain CSS rather than per-variant SVG exports.
//
// Pulls every color/size/typography value from css/tokens.css custom
// properties (via var() inside this component's own shadow-root <style>) —
// do not hardcode colors, sizes, or fonts here. Custom properties defined on
// the document (:root, in tokens.css) inherit through the shadow boundary,
// so tokens.css + fonts.css just need to be loaded once in the page; this
// component does not need to import them itself.
//
// Note: Size isn't just a font-size change — Large and Medium use two
// genuinely different typography styles in Figma (confirmed via
// get_design_context, not just get_variable_defs): Large uses the Heading
// style, Medium uses Caption Title. This component switches font-family/
// size/line-height/weight together per size, not just the numeric size.
//
// Attributes:
//   color   "brand" | "neutral"  (default: "neutral")
//   size    "large" | "medium"   (default: "medium")
//
// The number itself is light-DOM content via <slot>, same convention as
// <ds-tag>'s label — e.g. <ds-bubble-number>1</ds-bubble-number>.
//
// Usage:
//   <ds-bubble-number color="brand" size="large">1</ds-bubble-number>
//   <ds-bubble-number color="neutral" size="medium">3</ds-bubble-number>

const BUBBLE_NUMBER_TEMPLATE = /* html */ `
<style>
  :host {
    /* fallback tokens if color attribute isn't set yet — keeps the element
       from rendering unstyled before upgrade/attribute sync */
    --bn-bg: var(--color-background-neutral-default);
    --bn-fg: var(--color-text-neutral-on-neutral);

    box-sizing: border-box;
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--bn-bg);
    color: var(--bn-fg);
    text-align: center;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Color -> token map (Background/[Color]/Default + Text/[Color]/On [Color] pair). */
  :host([color="brand"]) {
    --bn-bg: var(--color-background-brand-default);
    --bn-fg: var(--color-text-brand-on-brand);
  }
  :host([color="neutral"]) {
    --bn-bg: var(--color-background-neutral-default);
    --bn-fg: var(--color-text-neutral-on-neutral);
  }

  /* Size -> dimensions + typography style. Large uses the Heading style,
     Medium uses Caption Title — two different type styles, not just two
     font-size numbers of the same one (see note above the template). */
  :host([size="large"]) {
    width: 32px;
    height: 32px;
    font-family: var(--typography-heading-font-family), sans-serif;
    font-size: var(--typography-heading-size-6);
    line-height: var(--typography-heading-line-height-6);
    /* No font-weight set on purpose, same reasoning as .content__intro-heading in
       main.css: FFGoodProWide-Medium.woff2 is the only face registered
       under "FF Good Pro Wide" in fonts.css -- nothing for a numeric
       weight to choose between, the Medium look comes from which file
       loaded. (--typography-heading-font-weight is also unusable here:
       it's the raw Figma string "Medium", which isn't a valid CSS
       font-weight keyword and would be silently dropped.) */
  }
  :host([size="medium"]) {
    width: 24px;
    height: 24px;
    font-family: var(--typography-caption-title-font-family), sans-serif;
    font-size: var(--typography-caption-title-size);
    line-height: var(--typography-caption-title-line-height);
    /* Hardcoded on purpose (not a token): unlike Large above, "FF Good Pro"
       has two real static faces in fonts.css (Regular 400 / Bold 700), so
       Caption Title's Bold actually needs to be selected explicitly.
       --typography-caption-title-font-weight is the raw Figma string
       "Bold" -- it happens to double as a valid CSS keyword so it would
       "work" by coincidence, but that's fragile (a differently-spelled
       Figma weight label would silently break), so this selects the real
       face by its actual numeric weight instead. */
    font-weight: 700;
  }
</style>
<span class="label" part="label"><slot></slot></span>
`;

class DsBubbleNumber extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = BUBBLE_NUMBER_TEMPLATE;
  }

  connectedCallback() {
    if (!this.hasAttribute("color")) this.setAttribute("color", "neutral");
    if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
  }
}

customElements.define("ds-bubble-number", DsBubbleNumber);
