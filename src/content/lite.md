# Lite

A CSS-only marquee with simple class names and no JavaScript.

## Contents

- [Use it](#use-it)
- [Default](#default)
- [Reverse](#reverse)
- [More aliases](#more-aliases)
- [Vertical](#vertical)
- [Stepped timing](#stepped-timing)
- [Pause on hover](#pause-on-hover)
- [Paused](#paused)

---

## Use it

Import `remarqueeble/lite.css` or load `dist/lite.css` directly. For direct CDN
usage, `dist/lite.min.css` is also available.

```html
<link rel="stylesheet" href="https://unpkg.com/remarqueeble/dist/lite.css" />
```

The lite CSS follows the simpler pure-CSS pattern and does not require
duplicated content. It does not emulate legacy `<marquee>` measurement,
`behavior`, `scrollamount`, or `scrolldelay`.

When `prefers-reduced-motion: reduce` is active, animation is disabled and the
content is shown statically.

Optional classes: `re-marquee--reverse`, `re-marquee--left`,
`re-marquee--right`, `re-marquee--alternate`, `re-marquee--vertical`,
`re-marquee--up`, `re-marquee--down`, `re-marquee--paused`, and
`re-marquee--pause-on-hover`.

CSS variables:

- `--re-marquee-duration`: animation duration. Defaults to `20s`.
- `--re-marquee-iteration-count`: animation iteration count. Defaults to
  `infinite`.
- `--re-marquee-timing-function`: animation timing function. Defaults to
  `linear`.
- `--re-marquee-start-pos`: starting transform position. Defaults to `0` for
  horizontal marquees and a container-height offset for vertical ones.
- `--re-marquee-end-pos`: ending transform position. Defaults to `-100%`.

```html
<div class="re-marquee" style="--re-marquee-duration: 12s;">
    <div class="re-marquee__track">CSS-only marquee</div>
</div>
```

[Back to top](#)

---

## Default

Single-line motion with the base timing.

<div class="lite-lane">
	<div class="re-marquee" style="--re-marquee-duration: 14s;">
		<div class="re-marquee__track">
			<span>Fresh build</span>
			<strong>CSS-only</strong>
			<span>no JS required</span>
		</div>
	</div>
</div>

```html
<div class="re-marquee" style="--re-marquee-duration: 14s;">
    <div class="re-marquee__track">
        <span>Fresh build</span>
        <strong>CSS-only</strong>
        <span>no JS required</span>
    </div>
</div>
```

[Back to top](#)

---

## Reverse

The same structure, but running in the opposite direction.

<div class="lite-lane">
	<div class="re-marquee re-marquee--reverse" style="--re-marquee-duration: 18s;">
		<div class="re-marquee__track">
			<span>Right to left</span>
			<span>left to right</span>
			<em>reverse flow</em>
		</div>
	</div>
</div>

```html
<div class="re-marquee re-marquee--reverse" style="--re-marquee-duration: 18s;">
    <div class="re-marquee__track">
        <span>Right to left</span>
        <span>left to right</span>
        <em>reverse flow</em>
    </div>
</div>
```

[Back to top](#)

---

## More aliases

The extra helper names map onto the same Lite behaviors, but match marquee-like
direction and behavior wording more closely.

<div class="lite-lane">
	<div class="re-marquee re-marquee--right" style="--re-marquee-duration: 13s;">
		<div class="re-marquee__track">
			<span>`re-marquee--right`</span>
			<span>same motion as reverse</span>
			<em>alias class</em>
		</div>
	</div>
</div>

<div class="lite-lane">
	<div class="re-marquee re-marquee--alternate" style="--re-marquee-duration: 7s;">
		<div class="re-marquee__track">
			<span>`re-marquee--alternate`</span>
			<span>bounces per cycle</span>
			<strong>alternate</strong>
		</div>
	</div>
</div>

<div class="lite-lane">
	<div class="re-marquee re-marquee--down" style="--re-marquee-duration: 9s; block-size: 9rem;">
		<div class="re-marquee__track">
			<span>`re-marquee--down`</span>
			<span>vertical</span>
			<span>reverse direction</span>
		</div>
	</div>
</div>

```html
<div class="re-marquee re-marquee--right" style="--re-marquee-duration: 13s;">
    <div class="re-marquee__track">
        <span>`re-marquee--right`</span>
        <span>same motion as reverse</span>
        <em>alias class</em>
    </div>
</div>

<div
    class="re-marquee re-marquee--alternate"
    style="--re-marquee-duration: 7s;">
    <div class="re-marquee__track">
        <span>`re-marquee--alternate`</span>
        <span>bounces per cycle</span>
        <strong>alternate</strong>
    </div>
</div>

<div
    class="re-marquee re-marquee--down"
    style="--re-marquee-duration: 9s; block-size: 9rem;">
    <div class="re-marquee__track">
        <span>`re-marquee--down`</span>
        <span>vertical</span>
        <span>reverse direction</span>
    </div>
</div>
```

[Back to top](#)

---

## Vertical

A taller lane with stacked content.

<div class="lite-lane">
	<div class="re-marquee re-marquee--vertical" style="--re-marquee-duration: 16s; block-size: 12rem;">
		<div class="re-marquee__track">
			<span>Alpha</span>
			<span>Beta</span>
			<span>Gamma</span>
			<span>Delta</span>
		</div>
	</div>
</div>

```html
<div
    class="re-marquee re-marquee--vertical"
    style="--re-marquee-duration: 16s; block-size: 12rem;">
    <div class="re-marquee__track">
        <span>Alpha</span>
        <span>Beta</span>
        <span>Gamma</span>
        <span>Delta</span>
    </div>
</div>
```

[Back to top](#)

---

## Stepped timing

Use any CSS animation timing function, including `steps()`, for chunkier
legacy-style motion.

<div class="lite-lane">
	<div class="re-marquee" style="--re-marquee-duration: 10s; --re-marquee-timing-function: steps(24, end);">
		<div class="re-marquee__track">
			<span>Stepped motion</span>
			<strong>steps(24, end)</strong>
			<span>CSS timing</span>
		</div>
	</div>
</div>

```html
<div
    class="re-marquee"
    style="--re-marquee-duration: 10s; --re-marquee-timing-function: steps(24, end);">
    <div class="re-marquee__track">
        <span>Stepped motion</span>
        <strong>steps(24, end)</strong>
        <span>CSS timing</span>
    </div>
</div>
```

[Back to top](#)

---

## Pause on hover

Hover the lane to freeze it.

<div class="lite-lane">
	<div class="re-marquee re-marquee--pause-on-hover" style="--re-marquee-duration: 11s;">
		<div class="re-marquee__track">
			<span>Hover me</span>
			<span>and I stop</span>
			<span>moving</span>
		</div>
	</div>
</div>

```html
<div
    class="re-marquee re-marquee--pause-on-hover"
    style="--re-marquee-duration: 11s;">
    <div class="re-marquee__track">
        <span>Hover me</span>
        <span>and I stop</span>
        <span>moving</span>
    </div>
</div>
```

[Back to top](#)

---

## Paused

A static state for holding a frame in place.

<div class="lite-lane">
	<div class="re-marquee re-marquee--paused" style="--re-marquee-duration: 11s;">
		<div class="re-marquee__track">
			<span>Paused</span>
			<span>on purpose</span>
			<mark>still visible</mark>
		</div>
	</div>
</div>

```html
<div class="re-marquee re-marquee--paused" style="--re-marquee-duration: 11s;">
    <div class="re-marquee__track">
        <span>Paused</span>
        <span>on purpose</span>
        <mark>still visible</mark>
    </div>
</div>
```

[Back to top](#)
