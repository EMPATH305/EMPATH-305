# Stylesheet sources

Edit these source files, then run `npm run build:css`. Commit both the sources and the generated root `styles.css`. `npm test` checks that the bundle is current.

`manifest.json` defines the cascade order. Its entries are contiguous sections of the stylesheet before v23.13, not CSS cascade layers. Their order is intentional: later sections override earlier declarations. Keep each rule, media query and comment intact when moving boundaries.

| Source | Main contents |
| --- | --- |
| 01-foundation.css | Initial effects, document foundations and shared controls |
| 02-room-foundations.css | Initial E/M/P/A/T/H room and archive styles |
| 03-effects-and-accessibility.css | Effects, breathing, display modes and accessibility |
| 04-page-and-art-direction.css | Separate room pages, homepage and cinematic art direction |
| 05-editorial-and-microdetails.css | Editorial overrides, interaction styling and microdetails |
| 06-concept-and-art-overrides.css | Concept experience, content rhythm and art overrides |
| 07-responsive-and-layout.css | Mobile/in-app viewport, accessibility and layout overrides |
| 08-room-and-community-refinements.css | Later room refinements, community safety and calendar |

The browser continues to request only `styles.css`; source files are not linked or precached individually. Concatenation adds no separators and performs no minification, URL rewriting or reordering. Relative asset URLs remain relative to root `styles.css`.

Future semantic regrouping must be reviewed separately because it can change precedence. The v23.13 extraction reproduces the previous deployed stylesheet byte for byte.
