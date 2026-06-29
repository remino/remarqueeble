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
- [Usage](#usage)
- [Attributes](#attributes)
- [API](#api)
- [Development](#development)
- [Contributing](#contributing)
- [Licence](#licence)

<!-- mtoc-end -->

---

## Installation

```sh
npm install remarqueeble
```

[Back to top](#)

---

## Usage

Register the custom elements automatically:

```js
import 'remarqueeble/auto'
```

Or register them explicitly:

```js
import { defineRemarqueebleElements } from 'remarqueeble'

defineRemarqueebleElements()
```

Then use either element name:

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
