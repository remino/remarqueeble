# Lite

A CSS-only marquee with simple class names and no JavaScript.

## Contents

- [Use it](#use-it)
- [Default](#default)
- [Reverse](#reverse)
- [Vertical](#vertical)
- [Pause on hover](#pause-on-hover)
- [Paused](#paused)

---

## Use it

Import `remarqueeble/lite.css` or load `dist/lite.css` directly.

```html
<link rel="stylesheet" href="https://unpkg.com/remarqueeble/dist/lite.css" />
```

The lite CSS follows the simpler pure-CSS pattern and does not require
duplicated content. It does not emulate legacy `<marquee>` measurement,
`behavior`, `scrollamount`, `scrolldelay`, or finite `loop` handling.

Optional classes: `re-marquee--reverse`, `re-marquee--vertical`,
`re-marquee--paused`, and `re-marquee--pause-on-hover`.

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
<div class="re-marquee re-marquee--vertical" style="--re-marquee-duration: 16s; block-size: 12rem;">
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
<div class="re-marquee re-marquee--pause-on-hover" style="--re-marquee-duration: 11s;">
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
