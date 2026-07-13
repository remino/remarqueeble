# CHANGELOG

<!-- mtoc-start -->

- [HEAD](#head)
- [v0.6.0](#v060)
- [v0.5.0](#v050)
- [v0.4.0](#v040)
- [v0.3.0](#v030)
- [v0.2.0](#v020)
- [v0.1.0](#v010)

<!-- mtoc-end -->

## HEAD

## v0.6.0

- Library
    - Add an `animate` attribute with `always`, `overflow`, and `never` modes.
    - Allow `scrollamount` to use CSS length values.
- Site
    - Add the `animate` attribute to the documentation and Playground.
    - Allow CSS length values in the Playground `scrollamount` control.
    - Keep the Playground demo stage sticky on narrow displays.
    - Keep narrow Playground header actions left-aligned with the sticky stage.

## v0.5.0

- Library
    - Add a minified `dist/lite.min.css` build and package export using
      Lightning CSS.
    - Show Lite content statically under `prefers-reduced-motion: reduce`.
    - Fix Lite marquee start position on wide containers.
    - Match native `<marquee>` by freezing when `scrollamount` is `0`.
- Site
    - Add documentation for `--re-marquee-timing-function` in Lite.
    - Add documentation for `--re-marquee-start-pos` in Lite.
- Development
    - Add guarded local release automation using `release-it`.

## v0.4.0

- Library
    - Keep CDN and browser defaults on the auto-registration build while
      preserving explicit API imports for ESM and CommonJS.
    - Remove the extra non-auto minified browser distribution files.
    - Register `<re-marquee>` and `<re-marquee-ble>` with distinct constructors
      to avoid browser `NotSupportedError` failures.
- Site
    - Refine the Playground layout with a full-width header, clearer preview and
      code areas, and a separate controls column.
    - Store Playground settings as individual hash parameters instead of a
      JSON-encoded hash value.
    - Add preview-stage fullscreen toggling from the Full Screen button or a
      double click/tap on blank preview space.
    - Allow basic sanitized HTML in Playground content using DOMPurify.
    - Add Playground style controls for font size, text colour, and background
      colour.
    - Add a Playground reset button.
    - Add Shiki-highlighted generated code output with a reusable
      `<code-viewer>` custom element.
    - Move page `<main>` markup into `BaseLayout` with an optional `mainClass`
      prop.
    - Keep built Playground CSS external so published styles match the
      development server when using nested CSS.

## v0.3.0

- Library
    - Add CSS-animation-backed scrolling behaviour.
    - Adjust package exports and add minified distribution files.
- Site
    - Expand the Demo page into a configurable playground.

## v0.2.0

- Site
    - Add social share image metadata.
    - Refine the documentation site title and heading structure.
    - Add the missing `/demo/` page directory to the site source.

## v0.1.0

- Library
    - Initial release of `<re-marquee>` and `<re-marquee-ble>`.
    - Add support for legacy marquee attributes and behaviours.
    - Add generated distribution files and TypeScript declarations.
- Site
    - Add the Astro documentation site, README, licence, and npm scripts.
