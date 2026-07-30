# <mark aria-label="Remarqueeble">&lt;re-marquee&gt;ble</mark>

A tiny custom element tribute to the cursed glory of `<marquee>`, exposed as
`<re-marquee>` and `<re-marquee-ble>`.

Remarqueeble v0.7.0

By Rémino Rem  
<https://remino.net/>

[Docs](https://remino.net/remarqueeble/) |
[Code Repo](https://github.com/remino/remarqueeble) |
[npm Package](https://www.npmjs.com/package/remarqueeble)

---

<!-- mtoc-start -->

- [Installation](#installation)
    - [HTML (CDN)](#html-cdn)
    - [npm](#npm)
    - [Direct download](#direct-download)
- [Usage](#usage)
- [Feature Comparison](#feature-comparison)
- [Attributes](#attributes)
- [API](#api)
- [Remarquee Lite](#remarquee-lite)
- [Development](#development)
- [Contributing](#contributing)
- [Licence](#licence)

<!-- mtoc-end -->

---

## Installation

### HTML (CDN)

Register the custom elements automatically from a CDN:

```html
<script src="https://unpkg.com/remarqueeble"></script>
```

Mirrors:

- https://unpkg.com/remarqueeble
- https://cdn.jsdelivr.net/npm/remarqueeble

Use a pinned version in production:

```html
<script src="https://unpkg.com/remarqueeble@0.7.0"></script>
```

If you want the API instead of auto-registration, import the ES module directly:

```html
<script type="module">
    import { defineRemarqueebleElements } from 'https://unpkg.com/remarqueeble@0.7.0/dist/remarqueeble.mjs'

    defineRemarqueebleElements()
</script>
```

### npm

Install the package first:

```sh
npm install remarqueeble
```

Then register the custom elements automatically:

```js
import 'remarqueeble/auto'
```

Or import the explicit API:

```js
import { defineRemarqueebleElements } from 'remarqueeble'

defineRemarqueebleElements()
```

TypeScript declarations are included with the package.

Bundlers normally minify production builds for you, so npm users should prefer
the package exports above instead of importing files from `dist/` directly.

### Direct download

Download the package tarball or individual files from npm/CDN:

- https://www.npmjs.com/package/remarqueeble
- https://unpkg.com/remarqueeble/dist/
- https://cdn.jsdelivr.net/npm/remarqueeble/dist/

The browser-ready auto-registration file is `dist/remarqueeble-auto.min.js`.

Distribution files:

- `dist/remarqueeble.mjs`: ES module library API.
- `dist/remarqueeble.cjs`: CommonJS library API.
- `dist/remarqueeble-auto.mjs`: ES module auto-registration entry.
- `dist/remarqueeble-auto.cjs`: CommonJS auto-registration entry.
- `dist/remarqueeble-auto.min.js`: minified classic browser auto-registration.
- `dist/lite.css`: CSS-only marquee styles.
- `dist/lite.min.css`: minified CSS-only marquee styles.

[Back to top](#)

---

## Usage

After registration, use either element name:

```html
<re-marquee>Default marquee behaviour.</re-marquee>
<re-marquee-ble direction="right">Rightward marquee behaviour.</re-marquee-ble>
```

[Back to top](#)

---

## Feature Comparison

| Feature                           | `<re-marquee>`                | `.re-marquee`                    | `<marquee>`                  |
| --------------------------------- | ----------------------------- | -------------------------------- | ---------------------------- |
| JavaScript required               | ✅ Yes                        | ❌ No                            | ❌ No                        |
| Works in modern browsers          | ✅ Yes                        | ✅ Yes                           | ⚠️ Partial / legacy          |
| Legacy marquee tag compatibility  | ✅ High                       | ⚠️ Low                           | ✅ Native                    |
| `behavior="scroll"`               | ✅ Yes                        | ⚠️ Approximate                   | ✅ Yes                       |
| `behavior="slide"`                | ✅ Yes                        | ❌ No                            | ✅ Yes                       |
| `behavior="alternate"`            | ✅ Yes                        | ⚠️ Approximate                   | ✅ Yes                       |
| `direction="left/right/up/down"`  | ✅ Yes                        | ✅ Yes                           | ✅ Yes                       |
| `animate="always/overflow/never"` | ✅ Yes                        | ⚠️ Partial                       | ❌ No                        |
| `scrollamount` / `scrolldelay`    | ✅ Yes                        | ❌ No                            | ✅ Yes                       |
| Finite `loop` support             | ✅ Yes                        | ✅ Yes                           | ✅ Yes                       |
| `start()` / `stop()` methods      | ✅ Yes                        | ❌ No                            | ✅ Yes                       |
| Legacy marquee events             | ✅ Yes                        | ❌ No                            | ⚠️ Browser-dependent         |
| CSS-only usage                    | ❌ No                         | ✅ Yes                           | ❌ No                        |
| Reduced-motion static fallback    | ✅ Yes                        | ✅ Yes                           | ⚠️ Browser-dependent         |
| Best use case                     | ✅ Modern marquee replacement | ✅ Lightweight decorative motion | ⚠️ Legacy compatibility only |

[Back to top](#)

---

## Attributes

<mark aria-label="Remarqueeble">&lt;re-marquee&gt;ble</mark> follows the legacy
marquee attribute names where practical:

- `animate`: `always`, `overflow`, or `never`. Defaults to `always`.
- `behavior`: `scroll`, `slide`, or `alternate`.
- `direction`: `left`, `right`, `up`, or `down`.
- `scrollamount`: step size as a non-negative number or CSS length. Unitless
  numbers are pixels.
- `scrolldelay`: delay between steps in milliseconds.
- `truespeed`: keeps delays under 60ms instead of clamping them.
- `loop`: positive loop count, or `-1` for infinite scrolling.
- `bgcolor`, `width`, `height`, `hspace`, `vspace`: presentational hints mapped
  to CSS.

[Back to top](#)

---

## API

Each element exposes the legacy methods:

```js
const marquee = document.querySelector('re-marquee')

marquee.stop()
marquee.start()
```

[Back to top](#)

---

## Remarquee Lite

For a CSS-only marquee, import `remarqueeble/lite.css` or load `dist/lite.css`
directly. For direct CDN usage, `dist/lite.min.css` is also available.

```html
<link rel="stylesheet" href="https://unpkg.com/remarqueeble/dist/lite.css" />

<div class="re-marquee" style="--re-marquee-duration: 12s;">
    <div class="re-marquee__track">CSS-only marquee</div>
</div>
```

The lite CSS follows the simpler pure-CSS pattern and does not require
duplicated content. It does not emulate legacy `<marquee>` measurement,
`behavior`, `scrollamount`, `scrolldelay`, or finite `loop` handling.

When `prefers-reduced-motion: reduce` is active, animation is disabled and the
content is shown statically.

Optional classes:

- `re-marquee--reverse`: scroll in the opposite direction.
- `re-marquee--left`: alias for the default leftward horizontal flow.
- `re-marquee--right`: alias for `re-marquee--reverse`.
- `re-marquee--alternate`: alternate the animation direction on each cycle.
- `re-marquee--vertical`: scroll vertically.
- `re-marquee--up`: alias for `re-marquee--vertical`.
- `re-marquee--down`: vertical flow in the reverse direction.
- `re-marquee--paused`: pause the animation.
- `re-marquee--pause-on-hover`: pause while hovered.

CSS variables:

- `--re-marquee-duration`: animation duration. Defaults to `20s`.
- `--re-marquee-timing-function`: animation timing function. Defaults to
  `linear`, and accepts values such as `steps(24, end)`.
- `--re-marquee-start-pos`: starting transform position. Defaults to `0`.
- `--re-marquee-end-pos`: ending transform position. Defaults to `-100%`.

[Back to top](#)

---

## Development

```sh
npm install
npm run dev
npm run build
```

The library source lives in `src/lib`. The documentation site is built with
Astro and lives in the rest of `src`.

Release automation is available through `release-it`. A release runs checks,
builds, publishes the npm package, pushes the release commit and tag, creates a
GitHub release, uploads `dist/*`, then publishes docs:

```sh
npm run release:dry-run
npm run release
```

If docs publishing fails after the package release, rerun it directly:

```sh
npm run docs:publish
```

Before running a real release, make sure `RELEASE_IT_GITHUB_TOKEN` is set and
`npm whoami --registry https://registry.npmjs.org/` passes. Release-it prompts
for an npm OTP when npm requires one.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Make your changes.
4. Run `npm run build` and `npm test`.
5. Commit, push, and open a pull request.

Issues and ideas are welcome—please star the project if you enjoy it!

[Back to top](#)

---

## Licence

Licensed under the ISC licence. See `LICENSE.md`.

[Back to top](#)
