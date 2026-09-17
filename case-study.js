// case-study.js — shared case-study page renderer.
//
// Every case-study page (self-service.html, quarter-in-review.html, ...)
// is an identical shell: nav, an empty .case-study-title, an empty
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
import "./components/callout.js";
import "./components/list-item.js";
import { appendListItems } from "./components/build-list-item.js";

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

  renderTitle(data.intro);
  renderSummary(data.intro.meta);
  renderContext(data.context);
}

function renderTitle(intro) {
  document.querySelector(".case-study-title__heading").textContent = intro.title;
  document.querySelector(".case-study-title__body").textContent = intro.subtitle;
  document.title = `${intro.title} — Scott Eshbaugh`;
}

// ds-summary's slots are fixed (goal/outcome/role/client-scope) and keyed
// here by label text, not by array position -- meta's order in the JSON
// is only for a human reading the file (see the Goal/Outcomes/Role/Client
// and scope reorder Bosco asked for across every case study), it has
// never driven what shows up where on screen. ds-summary's own
// grid-template-areas control the actual visual order per breakpoint.
const SUMMARY_SLOT_BY_LABEL = {
  "Goal": "goal",
  "Outcomes": "outcome",
  "Role": "role",
  "Client and scope": "client-scope",
};

function renderSummary(meta) {
  const summary = document.querySelector("ds-summary");
  for (const { label, text } of meta) {
    const slotName = SUMMARY_SLOT_BY_LABEL[label];
    if (!slotName) {
      console.warn(`Unknown summary label "${label}" -- no matching ds-summary slot`);
      continue;
    }
    const span = document.createElement("span");
    span.slot = slotName;
    span.textContent = text;
    summary.append(span);
  }
}

function renderContext(context) {
  document.querySelector(".section-divider__label").textContent = context.eyebrow;

  const callout = document.querySelector("ds-callout");
  const header = document.createElement("span");
  header.slot = "header";
  header.textContent = context.question;
  callout.append(header);

  const listItem = document.querySelector("ds-list-item");
  appendListItems(listItem, context.points);
}

renderCaseStudy();
