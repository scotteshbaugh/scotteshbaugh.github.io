// main.js — the homepage's own script (not a reusable "ds-" component).
//
// Builds the case studies list from data/case-studies.json instead of
// hand-authored markup, so the case study content lives in one JSON file
// rather than being duplicated into main.html card by card.
//
// Loaded as an ES module -- pulls in ds-card-case-study, which in turn
// imports ds-tag/ds-divider/ds-image/ds-list-item, so this one script tag
// is all main.html needs for both the card component and this page logic.

import "./components/card-case-study.js";

const LIST_SELECTOR = ".case-studies__list";
const DATA_URL = "data/case-studies.json";

async function renderCaseStudies() {
  const container = document.querySelector(LIST_SELECTOR);
  if (!container) return;

  let studies;
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    studies = await response.json();
  } catch (err) {
    console.error(`Failed to load ${DATA_URL}:`, err);
    return;
  }

  const cards = studies.map(buildCard);
  container.append(...cards);
}

function buildCard(study) {
  const card = document.createElement("ds-card-case-study");

  for (const tag of study.tags ?? []) {
    const el = document.createElement("ds-tag");
    el.slot = "tags";
    el.setAttribute("scheme", "brand");
    el.setAttribute("variant", "secondary");
    el.textContent = tag;
    card.append(el);
  }

  const header = document.createElement("h3");
  header.slot = "header";
  header.textContent = study.title;
  card.append(header);

  const description = document.createElement("p");
  description.slot = "description";
  description.textContent = study.description;
  card.append(description);

  // Two entries in case-studies.json have no outcome yet -- omit the slot
  // entirely rather than render an empty <p>, same effect either way since
  // the slot has no fallback content, but this keeps the markup honest
  // about what data actually exists.
  if (study.outcome) {
    const outcome = document.createElement("p");
    outcome.slot = "outcome";
    outcome.textContent = study.outcome;
    card.append(outcome);
  }

  card.append(buildListItem("meta", [study.year, ...(study.role ?? [])]));

  const image = document.createElement("ds-image");
  image.slot = "image";
  const img = document.createElement("img");
  img.src = study.image;
  img.alt = `Screenshot of the ${study.title} case study`;
  image.append(img);
  card.append(image);

  if (study.descriptors?.length) {
    card.append(buildListItem("descriptors", study.descriptors));
  }

  return card;
}

// Builds a <ds-list-item> for the given slot name from up to 3 strings:
// the first is the default (unnamed) slot, the rest go to item-2/item-3.
function buildListItem(slotName, items) {
  const listItem = document.createElement("ds-list-item");
  listItem.slot = slotName;
  const [first, ...rest] = items;
  listItem.append(document.createTextNode(first));
  rest.forEach((text, i) => {
    const span = document.createElement("span");
    span.slot = `item-${i + 2}`;
    span.textContent = text;
    listItem.append(span);
  });
  return listItem;
}

renderCaseStudies();
