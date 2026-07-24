/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scoped ONLY to the new authenticated platform + partner portal (docs/phase2/TECH_STACK.md §2,
  // DECISIONS.md D-08). The existing marketing site's pages/components are never scanned here.
  content: [
    './app/app/**/*.{ts,tsx}',
    './app/partner-portal/**/*.{ts,tsx}',
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
