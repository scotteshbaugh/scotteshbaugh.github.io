// case-study.js — shared case-study page renderer.
//
// Every case-study page (self-service.html, quarter-in-review.html, ...)
// is an identical shell: nav, an empty .case-study-header, an empty
// <ds-summary>, and an empty Context section. This script is what turns a
// shell into an actual page, by fetching that page's own
// data/case-studies/<slug>.json and building the slotted content into the
// shell. Change the shell markup once and every case-study page picks up
// the change (copy the new shell to each <slug>.html); change a slug's
// JSON and only that one page's content changes. Neither ever requires
// touching the other 4 pages.
//
// The slug comes from the page's own filename (this document's
// location.pathname, minus ".html") -- every case-study page is already
// named to match its JSON file 1:1 (data/case-studies.json's own "slug"
// field is what main.js uses to build each card's href in the first
// place), so there's nothing else that needs to say which case study a
// given page is.

import "./components/summary.js";
import "./components/pullout.js";
import "./components/list.js";
import "./components/image.js";
import { buildList } from "./components/build-list.js";

const slug = location.pathname.split("/").pop().replace(/\.html$/, "");
const DATA_URL = `data/case-studies/${slug}.json`;

async function renderCaseStudy() {
  let data;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    data = await response.json();
  } catch (err) {
    console.error(`Failed to load ${DATA_URL}:`, err);
    return;
  }

  renderCaseStudyHeader(data.caseStudyHeader);
  renderSummary(data.summary);
  renderContext(data.context);
  renderSolution(data.solution);
  renderProcess(data.process);
  renderOutcomes(data.outcomes);
}

// Keys mirror the Figma layer/component names (Case Study Header, Summary
// Item, Pullout, Section Divider ...) so the JSON reads like the layer tree
// -- see data/case-studies/_template.json.
function renderCaseStudyHeader(caseStudyHeader) {
  document.querySelector(".case-study-header__heading").textContent = caseStudyHeader.heading;
  document.querySelector(".case-study-header__body").textContent = caseStudyHeader.body;
  document.title = `${caseStudyHeader.heading} — Scott Eshbaugh`;
}

// ds-summary's slots are fixed (goal/outcome/role/client-scope) and keyed
// here by each item's title, not by array position -- the summary order in the JSON
// is only for a human reading the file (see the Outcome/Goal/Role/Client
// and scope reorder Bosco asked for across every case study), it has
// never driven what shows up where on screen. ds-summary's own
// grid-template-areas control the actual visual order per breakpoint.
const SUMMARY_SLOT_BY_TITLE = {
  "Goal": "goal",
  "Outcome": "outcome",
  "Role": "role",
  "Client and scope": "client-scope",
};

function renderSummary(summaryItems) {
  const summary = document.querySelector("ds-summary");
  for (const { title, description } of summaryItems) {
    const slotName = SUMMARY_SLOT_BY_TITLE[title];
    if (!slotName) {
      console.warn(`Unknown summary title "${title}" -- no matching ds-summary slot`);
      continue;
    }
    const span = document.createElement("span");
    span.slot = slotName;
    span.textContent = description;
    summary.append(span);
  }
}

function renderContext(context) {
  const pullout = document.querySelector("ds-pullout");
  const statement = document.createElement("span");
  statement.slot = "header";
  statement.textContent = context.statement;
  pullout.append(statement);

  buildList(document.querySelector("ds-list"), context.list);
}

// The Solution section's arrangement lives in the page markup, written
// from Figma: which layout each subsection uses, which showcase is a
// single image and which is split into panels, and each panel's span.
// This only fills that markup in with the case study's own words and
// image paths from its JSON.
//
// The two are matched by position and by letter: the nth subsection in
// the JSON fills the nth .layout in the page, and showcase "A" fills
// .layout__caption-a and .layout__showcase-a -- the same letters the
// Figma layers use, so a caption can't end up beside the wrong picture.
// A showcase's images fill its panels in order.
function renderSolution(solution) {
  const section = document.querySelector(".case-study-section");
  if (!section || !solution) return;

  const layouts = section.querySelectorAll(".layout");
  const subsections = solution.subsections ?? [];
  if (subsections.length !== layouts.length) {
    console.warn(`Solution: ${subsections.length} subsection(s) in the JSON, ${layouts.length} in the page markup`);
  }

  subsections.forEach((subsection, i) => {
    const layout = layouts[i];
    if (!layout) return;

    const heading = layout.querySelector(".subhead__heading");
    if (heading) heading.textContent = subsection.subhead ?? "";

    for (const showcase of subsection.showcases ?? []) {
      const letter = (showcase.showcase ?? "a").toLowerCase();

      const caption = layout.querySelector(`.layout__caption-${letter}`);
      if (caption) {
        caption.querySelector(".figure-caption__title").textContent = showcase.captionTitle ?? "";
        caption.querySelector(".figure-caption__body").textContent = showcase.captionBody ?? "";
      } else if (showcase.captionTitle || showcase.captionBody) {
        console.warn(`Solution: showcase ${letter.toUpperCase()} has a caption, but the page markup has no .layout__caption-${letter}`);
      }

      const slots = layout.querySelectorAll(`.layout__showcase-${letter} img`);
      const images = showcase.images ?? [];
      if (images.length !== slots.length) {
        console.warn(`Solution: showcase ${letter.toUpperCase()} has ${images.length} image(s) in the JSON, ${slots.length} in the page markup`);
      }
      images.forEach((image, n) => {
        const img = slots[n];
        if (!img) return;
        img.src = image.src;
        img.alt = image.alt ?? "";
      });
    }
  });

  // Figma's Figure Caption has Show Title and Show Body, and some
  // captions aren't written yet. Whatever the JSON left empty comes out
  // of the page: an empty line, a caption with neither part, and the
  // captions column if nothing is left in it.
  for (const layout of layouts) {
    for (const part of layout.querySelectorAll(".figure-caption__title, .figure-caption__body")) {
      if (!part.textContent.trim()) part.remove();
    }
    for (const caption of layout.querySelectorAll(".figure-caption")) {
      if (!caption.children.length) caption.remove();
    }
    for (const captions of layout.querySelectorAll(".layout__captions")) {
      if (!captions.children.length) captions.remove();
    }
  }
}

// Process and Outcome are both a Pullout Layout, so they share a shape:
// a statement or quote on the left, and its support on the right.
function renderProcess(process) {
  if (!process) return;
  const section = [...document.querySelectorAll(".case-study-section")]
    .find((s) => s.querySelector(".section-divider__label")?.textContent === "Process");
  if (!section) return;

  const pullout = section.querySelector("ds-pullout");
  const statement = document.createElement("span");
  statement.slot = "header";
  statement.textContent = process.statement;
  pullout.append(statement);

  // Not every case study has a description yet. Without one the line
  // comes out, so the statement sits straight above the action.
  const description = section.querySelector(".pullout-layout__description");
  if (process.description) {
    description.textContent = process.description;
  } else {
    description.remove();
  }

  // The action leaves the site (a PDF, or LinkedIn), which is what its
  // external-link icon says -- so it opens in a new tab.
  const action = section.querySelector(".pullout-layout__action");
  if (process.button?.label) {
    action.querySelector("span").textContent = process.button.label;
    if (process.button.href) {
      action.href = process.button.href;
      action.target = "_blank";
      action.rel = "noopener";
    } else {
      action.href = "#";
    }
  } else {
    action.remove();
  }
}

function renderOutcomes(outcomes) {
  if (!outcomes) return;
  const section = [...document.querySelectorAll(".case-study-section")]
    .find((s) => s.querySelector(".section-divider__label")?.textContent === "Outcome");
  if (!section) return;

  // Not every case study has a quote -- Figma's Pullout Layout has a Show
  // Quote property for this. Without one the pullout cell comes out of the
  // row entirely, and the CSS moves the list to the left edge.
  const pulloutCell = section.querySelector(".pullout-layout__pullout");
  if (outcomes.quote) {
    const pullout = pulloutCell.querySelector("ds-pullout");
    const quote = document.createElement("span");
    quote.slot = "header";
    quote.textContent = outcomes.quote;
    const attribution = document.createElement("span");
    attribution.slot = "attribution";
    attribution.textContent = outcomes.attribution;
    pullout.append(quote, attribution);
  } else {
    pulloutCell.remove();
  }

  buildList(section.querySelector("ds-list"), outcomes.list ?? []);
}

renderCaseStudy();
