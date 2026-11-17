# Frontend integration sources

These are ordered fragments, not independently loadable modules. The manifest preserves the lexical scope and initialization order of the existing application. Import paths resolve from the generated root-level `firebase-app.js`, not from this directory.

Edit the appropriate fragment, run `npm run build:frontend`, and commit both the sources and generated bundle. Never load these fragments directly from HTML or edit the generated file by hand. Existing root-level `.mjs` modules remain separately maintained modules.

Run `npm test` after installing backend dependencies with `npm ci --prefix functions --ignore-scripts`. CI checks manifest completeness, byte equality with the generated bundle, application checks and browser flows.
