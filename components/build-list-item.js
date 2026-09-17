// buildListItem — shared helper for populating a <ds-list-item> from a
// plain array of strings.
//
// Used by both main.js (the homepage's cards, built fresh each time) and
// case-study.js (every case-study page's Context points, populating a
// <ds-list-item> that's already sitting in that page's shell markup) --
// pulled out into its own file so there's exactly one place that knows
// how a list of strings maps onto ds-list-item's slots (item 1 in the
// default slot, item 2+ in item-2/item-3/item-4). Change how that mapping
// works once here and both call sites pick it up automatically.
//
// ds-list-item itself currently caps out at 4 items (default + item-2/3/4
// -- see components/list-item.js) -- this helper doesn't enforce that, it
// just appends everything it's given, so a 5th+ string here would slot
// into a name ds-list-item doesn't define and silently not render. Keep
// any list fed through this at 4 items or fewer.

export function appendListItems(listItem, items) {
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
