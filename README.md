# Remarqueeble

A tiny custom element tribute to the cursed glory of `<marquee>`, exposed as
`<re-marquee>` and `<re-marquee-ble>`.

[Demo](https://remino.net/remarqueeble/demo/) |
[Code Repo](https://github.com/remino/remarqueeble) |
[npm Package](https://www.npmjs.com/package/remarqueeble)

## Installation

```sh
npm install remarqueeble
```

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

## Attributes

Remarqueeble follows the legacy marquee attribute names where practical:

- `behavior`: `scroll`, `slide`, or `alternate`.
- `direction`: `left`, `right`, `up`, or `down`.
- `scrollamount`: step size in pixels.
- `scrolldelay`: delay between steps in milliseconds.
- `truespeed`: keeps delays under 60ms instead of clamping them.
- `loop`: positive loop count, or `-1` for infinite scrolling.
- `bgcolor`, `width`, `height`, `hspace`, `vspace`: presentational hints mapped
  to CSS.

## API

Each element exposes the legacy methods:

```js
const marquee = document.querySelector('re-marquee')

marquee.stop()
marquee.start()
```

## Development

```sh
npm install
npm run dev
npm run build
```

The library source lives in `src/lib`. The documentation site is built with
Astro and lives in the rest of `src`.
