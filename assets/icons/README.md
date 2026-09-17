# Icons

Feather Icons, vendored from npm — the same set Figma's Simple Design System
uses, which is where the icon sheet in `portfolio.fig` (node 278:58721) comes
from. All 287 names map one-to-one with that sheet in both directions, so an
icon picked in Figma is the same-named file here.

- Source: `feather-icons` 4.29.2 (https://feathericons.com)
- License: MIT, Cole Bemis — see `LICENSE`

## Why npm and not a Figma export

Figma exports an icon with its stroke color baked in, which is exactly what
stops a parent component from coloring it. These ship as authored:
`stroke="currentColor"`, `fill="none"`, `viewBox="0 0 24 24"`. An icon
button sets `color` and the icon follows.

Feather's own `class="feather feather-*"` hook is stripped -- it targets
Feather's stylesheet, which this project doesn't use.

## Shape of a file

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">…</svg>
```

`width`/`height` are defaults, not constraints -- CSS overrides them. Note
these are **stroked**, not filled: `stroke-width: 2` is in user units inside
the `0 0 24 24` viewBox, so it is always 1/12th of the rendered size. Draw
the icon at 16px and the stroke is 1.33px; at 48px it is 4px. Scaling is
automatic and cannot be turned off from the file.

## Matching Figma's stroke weights

Figma is the reference, and its icon sheets do NOT scale linearly. Simple
Design System hand-tuned the stroke at each size so small icons don't go
spindly, and those weights were carried into this project's own
`Icon/<size>/<Name>` components. Linear scaling and Figma agree at 48 and
nowhere else:

| Size | Linear (this file) | Figma |
|-----:|-------------------:|------:|
|   16 |               1.33 |   1.6 |
|   20 |               1.67 |   2.0 |
|   24 |               2.00 |   2.5 |
|   32 |               2.67 |   3.0 |
|   48 |               4.00 |   4.0 |

So an icon component that renders these files at a given size MUST override
`stroke-width` to match. CSS `stroke-width` beats the attribute in the file
and is expressed in viewBox units, so the override per size is:

| Size | `stroke-width` |
|-----:|---------------:|
|   16 |            2.4 |
|   20 |            2.4 |
|   24 |            2.5 |
|   32 |           2.25 |
|   48 |            2.0 |

Do not "fix" this by editing the files -- the attribute is Feather's own
default and re-pulling would overwrite it. The correction belongs in the
component that sizes the icon.

## Re-pulling

```sh
npm pack feather-icons
tar xzf feather-icons-*.tgz
# copy package/dist/icons/*.svg here, stripping the class attribute
```
