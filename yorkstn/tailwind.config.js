/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scoped ONLY to the new authenticated platform + partner portal (docs/phase2/TECH_STACK.md §2,
  // DECISIONS.md D-08). The existing marketing site's pages/components are never scanned here.
  content: [
    // NOTE (found/fixed during Milestone 6): these paths must match the actual
    // `(platform)` route-group directory (DECISIONS.md D-23), not the pre-
    // restructuring `app/app/**` / `app/partner-portal/**` paths. Content globs
    // don't error on a typo/stale path — they just silently generate no CSS for
    // anything outside them, so a mismatch here is invisible without actually
    // rendering a page in a browser.
    './app/(platform)/**/*.{ts,tsx}',
    './components/platform/**/*.{ts,tsx}',
  ],
  // DECISIONS.md D-21: prefix + preflight disabled so Tailwind's generated CSS can never leak
  // into or collide with the marketing site's hand-rolled custom-cursor/grain-texture design
  // system (app/globals.css), even though both are compiled into the same Next.js app.
  prefix: 'tw-',
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
