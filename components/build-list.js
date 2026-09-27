// buildList — shared helper for filling a <ds-list> from a plain array of
// strings.
//
// Used by both main.js (the homepage's cards, built fresh each time) and
// case-study.js (a case study's points, filling a <ds-list> that's already
// sitting in that page's shell markup) -- one place that knows how a list
// of strings becomes list items. Change it here and both call sites pick
// it up.
//
// Any number of items: the list numbers and divides whatever it is given.

export function buildList(list, items) {
  for (const text of items) {
    const item = document.createElement("ds-list-item");
    item.textContent = text;
    list.append(item);
  }
  return list;
}
