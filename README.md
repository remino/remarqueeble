# <mark aria-label="Remarqueeble">&lt;re-marquee&gt;ble</mark>

A tiny custom element tribute to the cursed glory of `<marquee>`, exposed as
`<re-marquee>` and `<re-marquee-ble>`.

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
- [Attributes](#attributes)
- [API](#api)
- [Development](#development)
- [Contributing](#contributing)
- [Licence](#licence)

<!-- mtoc-end -->

---

## Installation

### HTML (CDN)

Register the custom elements automatically from a CDN:

```html
<script
    type="module"
    src="https://unpkg.com/remarqueeble/dist/remarqueeble-auto.min.js"></script>
```

Mirrors:

- https://unpkg.com/remarqueeble/dist/remarqueeble-auto.min.js
- https://cdn.jsdelivr.net/npm/remarqueeble/dist/remarqueeble-auto.min.js

Use a pinned version in production:

```html
<script
    type="module"
    src="https://unpkg.com/remarqueeble@0.2.0/dist/remarqueeble-auto.min.js"></script>
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

### Direct download

Download the package tarball or individual files from npm/CDN:

- https://www.npmjs.com/package/remarqueeble
- https://unpkg.com/remarqueeble/dist/
- https://cdn.jsdelivr.net/npm/remarqueeble/dist/

The browser-ready auto-registration file is `dist/remarqueeble-auto.min.js`.

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

## Attributes

<mark aria-label="Remarqueeble">&lt;re-marquee&gt;ble</mark> follows the legacy
marquee attribute names where practical:

- `behavior`: `scroll`, `slide`, or `alternate`.
- `direction`: `left`, `right`, `up`, or `down`.
- `scrollamount`: step size in pixels.
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

## Development

```sh
npm install
npm run dev
npm run build
```

The library source lives in `src/lib`. The documentation site is built with
Astro and lives in the rest of `src`.

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
