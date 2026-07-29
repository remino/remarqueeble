import DOMPurify from 'dompurify'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import html from 'shiki/langs/html.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'

const form = document.querySelector('[data-playground]')
const preview = document.querySelector('[data-preview]')
const code = document.querySelector('code-viewer')
const eventsOutput = document.querySelector('[data-events-output]')
const eventsScroller = eventsOutput?.closest('pre') ?? null
const copyButton = document.querySelector('[data-copy]')
const fullscreenButton = document.querySelector('[data-fullscreen]')
const resetButton = document.querySelector('[data-reset]')
const speedSection = document.querySelector('[data-section="speed"]')
const liteCssSection = document.querySelector('[data-section="lite-css"]')
const speedSectionBody = document.querySelector('[data-section-body="speed"]')
const liteCssSectionBody = document.querySelector(
	'[data-section-body="lite-css"]'
)
const speedSectionNote = document.querySelector('[data-section-note="speed"]')
const liteCssSectionNote = document.querySelector(
	'[data-section-note="lite-css"]'
)
const CODE_VIEWER_TAG_NAME = 'code-viewer'
const showModeControls = [
	[
		'show-re-marquee',
		're-marquee',
		'<code>&lt;re-marquee&gt;</code> Custom Element',
	],
	['show-lite', 'lite', '<code>.re-marquee</code> Lite CSS Class'],
	['show-marquee', 'marquee', '<code>&lt;marquee&gt;</code> Native Element'],
]
const modeDependencies = {
	lite: [
		'<link rel="stylesheet" href="https://unpkg.com/remarqueeble/dist/lite.css" />',
	],
	're-marquee': ['<script src="https://unpkg.com/remarqueeble"></script>'],
}
const legacyShowModeNames = {
	showReMarquee: 'show-re-marquee',
	showLite: 'show-lite',
	showMarquee: 'show-marquee',
}
const defaultValues = {
	animate: 'always',
	behavior: 'scroll',
	content:
		'Default marquee behaviour. Nisi nisi anim enim consequat pariatur reprehenderit.',
	direction: 'left',
	duration: '20',
	scrollamount: '6',
	scrolldelay: '85',
	'show-lite': 'false',
	'show-marquee': 'false',
	'show-re-marquee': 'true',
	truespeed: 'false',
	width: '100%',
}
const textAttributes = [
	'animate',
	'behavior',
	'direction',
	'loop',
	'scrollamount',
	'scrolldelay',
	'width',
	'height',
	'bgcolor',
	'hspace',
	'vspace',
]
const liteStyleProperties = [
	[
		'duration',
		'--re-marquee-duration',
		value => {
			const number = Number(value.trim())

			return Number.isFinite(number) && number > 0 ? `${number}s` : ''
		},
	],
	[
		'loop',
		'--re-marquee-iteration-count',
		value => {
			const trimmed = value.trim()

			if (!trimmed) return ''

			const number = Number(trimmed)

			if (!Number.isFinite(number)) return ''
			if (number === -1) return 'infinite'
			return Number.isInteger(number) && number > 0 ? String(number) : ''
		},
	],
]
const styleProperties = [
	[
		'fontSize',
		'font-size',
		value => {
			const number = Number(value)

			return Number.isFinite(number) && number >= 8 && number <= 96
				? `${number}px`
				: ''
		},
	],
	['color', 'color'],
]
const settingNames = [
	...showModeControls.map(([name]) => name),
	...textAttributes,
	...liteStyleProperties.map(([name]) => name),
	...styleProperties.map(([name]) => name),
	'truespeed',
	'content',
]
const highlighter = createHighlighterCore({
	engine: createJavaScriptRegexEngine(),
	langs: [html],
	themes: [githubDark],
})
const EVENT_LOG_PLACEHOLDER = '// waiting for marquee events'
let eventLogEntries = []

const escapeHtml = value =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const escapeAttribute = value => escapeHtml(value).replaceAll('"', '&quot;')

const highlightCode = async value => {
	const shiki = await highlighter

	return shiki
		.codeToHtml(value, {
			lang: 'html',
			theme: 'github-dark',
		})
		.replace('class="shiki ', 'class="astro-code ')
}

class CodeViewer extends HTMLElement {
	mutationObserver = new MutationObserver(() => {
		this.source = this.textContent ?? ''
	})
	renderId = 0
	sourceValue = ''

	connectedCallback() {
		this.removeAttribute('data-source')

		if (!this.sourceValue) {
			this.sourceValue = this.textContent ?? ''
		}

		this.observeSource()
		this.render()
	}

	disconnectedCallback() {
		this.mutationObserver.disconnect()
	}

	get source() {
		return this.sourceValue
	}

	set source(value) {
		this.sourceValue = value
		this.render()
	}

	observeSource() {
		this.mutationObserver.observe(this, {
			characterData: true,
			childList: true,
			subtree: true,
		})
	}

	async render() {
		const currentRenderId = ++this.renderId
		const highlighted = await highlightCode(this.sourceValue)

		if (!this.isConnected || currentRenderId !== this.renderId) return

		this.removeAttribute('data-source')
		this.mutationObserver.disconnect()
		this.innerHTML = highlighted
		this.observeSource()
	}
}

if (
	typeof customElements !== 'undefined' &&
	!customElements.get(CODE_VIEWER_TAG_NAME)
) {
	customElements.define(CODE_VIEWER_TAG_NAME, CodeViewer)
}

const stripHexColorPrefix = value => value.replace(/^#/, '').trim()

const isHexColor = value => /^[\da-f]{3}(?:[\da-f]{3})?$/iu.test(value)

const normalizeHexColorValue = (value, fallback = '') => {
	const hex = stripHexColorPrefix(value)

	if (/^[\da-f]{3}$/iu.test(hex)) {
		return hex
			.split('')
			.map(character => character.repeat(2))
			.join('')
			.toLowerCase()
	}

	if (/^[\da-f]{6}$/iu.test(hex)) {
		return hex.toLowerCase()
	}

	return fallback
}

const readHexColorValue = name => {
	const value = normalizeHexColorValue(getValue(name))

	return value ? `#${value}` : ''
}

const parsePresentationalDimension = value => {
	const trimmed = value.trim()

	if (!trimmed) return ''

	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
		return `${trimmed}px`
	}

	return CSS.supports('width', trimmed) ? trimmed : ''
}

const parseLegacyColor = value => {
	const trimmed = value.trim()

	return trimmed && CSS.supports('background-color', trimmed) ? trimmed : ''
}

const sanitizeContentHtml = value =>
	DOMPurify.sanitize(value, {
		ALLOWED_ATTR: ['aria-label', 'class', 'title'],
		ALLOWED_TAGS: [
			'b',
			'br',
			'code',
			'em',
			'i',
			'mark',
			's',
			'small',
			'span',
			'strong',
			'u',
		],
	})

const getControl = name => form?.elements.namedItem(name)

const getValue = name => getControl(name)?.value ?? ''

const getDefaultValue = name => defaultValues[name] ?? ''

const getSelectedShowModes = () =>
	showModeControls
		.filter(([name]) => getControl(name)?.checked)
		.map(([, mode]) => mode)

const getShowModeLabelHtml = mode =>
	showModeControls.find(([, value]) => value === mode)?.[2] ?? mode

const getCodeDependencies = modes =>
	[...new Set(modes.flatMap(mode => modeDependencies[mode] ?? []))].join('\n')

const syncShowCheckboxAvailability = () => {
	const selectedModes = getSelectedShowModes()

	if (selectedModes.length === 0) {
		writeSetting('show-re-marquee', 'true')
	}

	const selectedControls = showModeControls
		.map(([name]) => getControl(name))
		.filter(control => control instanceof HTMLInputElement && control.checked)

	const shouldDisableChecked = selectedControls.length <= 1

	for (const [name] of showModeControls) {
		const control = getControl(name)

		if (!(control instanceof HTMLInputElement)) continue

		control.disabled = shouldDisableChecked && control.checked
	}
}

const syncSectionAvailability = () => {
	const selectedModes = getSelectedShowModes()
	const hasLiteMode = selectedModes.includes('lite')
	const hasElementMode =
		selectedModes.includes('re-marquee') || selectedModes.includes('marquee')

	if (liteCssSection instanceof HTMLDetailsElement) {
		liteCssSection.toggleAttribute('data-unavailable', !hasLiteMode)
	}

	if (speedSection instanceof HTMLDetailsElement) {
		speedSection.toggleAttribute('data-unavailable', !hasElementMode)
	}

	if (liteCssSectionBody instanceof HTMLDivElement) {
		liteCssSectionBody.inert = !hasLiteMode
	}

	if (speedSectionBody instanceof HTMLDivElement) {
		speedSectionBody.inert = !hasElementMode
	}

	if (liteCssSectionNote instanceof HTMLParagraphElement) {
		liteCssSectionNote.hidden = hasLiteMode
	}

	if (speedSectionNote instanceof HTMLParagraphElement) {
		speedSectionNote.hidden = hasElementMode
	}
}

const readSetting = name => {
	const control = getControl(name)

	if (control instanceof HTMLInputElement && control.type === 'checkbox') {
		return control.checked ? 'true' : 'false'
	}

	return getValue(name)
}

const writeSetting = (name, value) => {
	const control = getControl(name)

	if (control instanceof HTMLInputElement && control.type === 'checkbox') {
		control.checked = value === 'true'
		return
	}

	if (control) {
		control.value = value
	}
}

const syncRangeValue = (rangeName, value) => {
	const range = getControl(rangeName)
	const number = Number(value)

	if (range && Number.isFinite(number)) {
		range.value = String(number)
	}
}

const syncPairedInput = target => {
	if (!(target instanceof HTMLInputElement)) return

	if (target.name === 'scrollamountRange') {
		getControl('scrollamount').value = target.value
	}

	if (target.name === 'scrollamount') {
		syncRangeValue('scrollamountRange', target.value)
	}

	if (target.name === 'scrolldelayRange') {
		getControl('scrolldelay').value = target.value
	}

	if (target.name === 'scrolldelay') {
		getControl('scrolldelayRange').value = target.value
	}

	if (target.name === 'durationRange') {
		getControl('duration').value = target.value
	}

	if (target.name === 'duration') {
		syncRangeValue('durationRange', target.value)
	}
}

const syncPairedControls = () => {
	syncRangeValue('scrollamountRange', getValue('scrollamount'))
	getControl('scrolldelayRange').value = getValue('scrolldelay')
	syncRangeValue('durationRange', getValue('duration'))
}

const getAttributes = () => {
	const attributes = []

	for (const name of textAttributes) {
		const value =
			name === 'bgcolor' ? readHexColorValue(name) : getValue(name).trim()
		if (!value) continue
		if (getDefaultValue(name) === value) continue
		attributes.push([name, value])
	}

	if (getControl('truespeed')?.checked) {
		attributes.push(['truespeed', ''])
	}

	return attributes
}

const getStyleDeclarations = () =>
	styleProperties
		.map(([name, property, normalize]) => {
			const rawValue = getValue(name).trim()
			const value =
				name === 'color'
					? readHexColorValue(name)
					: normalize
						? normalize(rawValue)
						: rawValue

			return value && CSS.supports(property, value) ? [property, value] : null
		})
		.filter(Boolean)

const getStyleAttributeValue = () =>
	getStyleDeclarations()
		.map(([property, value]) => `${property}: ${value}`)
		.join('; ')

const getPreviewFontSizeValue = () => {
	const rawValue = getValue('fontSize').trim()
	const number = Number(rawValue)

	return Number.isFinite(number) && number >= 8 && number <= 96
		? `${number}px`
		: '16px'
}

const resolveComputedPixelValue = (property, value) => {
	const probe = document.createElement('div')
	const mount = preview ?? document.body

	probe.style.position = 'absolute'
	probe.style.visibility = 'hidden'
	probe.style.pointerEvents = 'none'
	probe.style.inset = '0'
	probe.style.fontSize = getPreviewFontSizeValue()
	probe.style.setProperty(property, value)
	mount.append(probe)

	const computedValue = globalThis
		.getComputedStyle(probe)
		.getPropertyValue(property)

	probe.remove()

	const number = Number.parseFloat(computedValue)

	return Number.isFinite(number) ? `${Math.round(number)}px` : ''
}

const normalizeNativeBoxAttribute = (name, value) => {
	const trimmed = value.trim()

	if (!trimmed) return ''

	if (/^[+-]?(?:\d+|\d*\.\d+)$/.test(trimmed)) {
		return trimmed
	}

	if (name === 'width' || name === 'height') {
		if (/^[+-]?(?:\d+|\d*\.\d+)%$/.test(trimmed)) {
			return trimmed
		}

		if (/^[+-]?(?:\d+|\d*\.\d+)px$/.test(trimmed)) {
			return trimmed.replace(/px$/, '')
		}

		if (CSS.supports('width', trimmed)) {
			return resolveComputedPixelValue(name, trimmed).replace(/px$/, '')
		}
	}

	if (
		(name === 'hspace' || name === 'vspace') &&
		CSS.supports('margin', trimmed)
	) {
		const property = name === 'hspace' ? 'margin-left' : 'margin-top'
		const resolved = resolveComputedPixelValue(property, trimmed)

		return resolved.replace(/px$/, '')
	}

	return ''
}

const getLiteBoxStyleDeclarations = () => {
	const declarations = []
	const width = parsePresentationalDimension(getValue('width'))
	const height = parsePresentationalDimension(getValue('height'))
	const hspace = parsePresentationalDimension(getValue('hspace'))
	const vspace = parsePresentationalDimension(getValue('vspace'))
	const bgcolor = parseLegacyColor(readHexColorValue('bgcolor'))

	if (width) {
		declarations.push(['width', width])
	}

	if (height) {
		declarations.push(['block-size', height])
	}

	if (hspace) {
		declarations.push(['margin-inline', hspace])
	}

	if (vspace) {
		declarations.push(['margin-block', vspace])
	}

	if (bgcolor) {
		declarations.push(['background-color', bgcolor])
	}

	return declarations
}

const getNativeAttributes = () =>
	getAttributes()
		.map(([name, value]) => {
			if (name === 'animate') {
				return null
			}

			if (
				name === 'width' ||
				name === 'height' ||
				name === 'hspace' ||
				name === 'vspace'
			) {
				const normalized = normalizeNativeBoxAttribute(name, value)

				return normalized ? [name, normalized] : null
			}

			return [name, value]
		})
		.filter(Boolean)

const getLiteStyleDeclarations = () =>
	liteStyleProperties
		.map(([name, property, normalize]) => {
			const rawValue = getValue(name).trim()
			const value = normalize ? normalize(rawValue) : rawValue

			return value ? [property, value] : null
		})
		.filter(Boolean)

const getLiteClassNames = () => {
	const classNames = ['re-marquee']
	const direction = getValue('direction') || defaultValues.direction
	const behavior = getValue('behavior') || defaultValues.behavior
	const animate = getValue('animate') || defaultValues.animate

	classNames.push(`re-marquee--${direction}`)

	if (behavior === 'alternate') {
		classNames.push('re-marquee--alternate')
	}

	if (animate === 'never') {
		classNames.push('re-marquee--paused')
	}

	return classNames
}

const getLiteStyleAttributeValue = () =>
	[
		...getLiteStyleDeclarations(),
		...getLiteBoxStyleDeclarations(),
		...getStyleDeclarations(),
	]
		.map(([property, value]) => `${property}: ${value}`)
		.join('; ')

const getElementCode = tagName => {
	const attributesSource =
		tagName === 'marquee' ? getNativeAttributes() : getAttributes()
	const attributes = [
		...attributesSource,
		...(getStyleAttributeValue() ? [['style', getStyleAttributeValue()]] : []),
	]
		.map(([name, value]) =>
			value ? `${name}="${escapeAttribute(value)}"` : name
		)
		.join(' ')
	const openTag = attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`
	const content = sanitizeContentHtml(getValue('content').trim())

	return `${openTag}${content}</${tagName}>`
}

const getLiteCode = () => {
	const attributes = [
		['class', getLiteClassNames().join(' ')],
		...(getLiteStyleAttributeValue()
			? [['style', getLiteStyleAttributeValue()]]
			: []),
	]
		.map(([name, value]) =>
			value ? `${name}="${escapeAttribute(value)}"` : name
		)
		.join(' ')
	const content = sanitizeContentHtml(getValue('content').trim())

	return `<div ${attributes}><div class="re-marquee__track">${content}</div></div>`
}

const applyAttributes = element => {
	const attributesSource =
		element.tagName.toLowerCase() === 'marquee'
			? getNativeAttributes()
			: getAttributes()

	for (const [name, value] of attributesSource) {
		if (value) {
			element.setAttribute(name, value)
		} else {
			element.setAttribute(name, '')
		}
	}

	for (const [property, value] of getStyleDeclarations()) {
		element.style.setProperty(property, value)
	}
}

const applyLiteAttributes = element => {
	element.className = getLiteClassNames().join(' ')

	for (const [property, value] of [
		...getLiteStyleDeclarations(),
		...getLiteBoxStyleDeclarations(),
		...getStyleDeclarations(),
	]) {
		element.style.setProperty(property, value)
	}
}

const attachMarqueeEventLogging = (element, mode) => {
	for (const type of ['start', 'bounce', 'finish']) {
		element.addEventListener(type, event => {
			appendEventLog(`[${mode}] ${event.type}`)
			console.log(`[playground:${mode}] ${event.type}`, event)
		})
	}
}

const renderEventLog = () => {
	if (!eventsOutput) return

	eventsOutput.textContent =
		eventLogEntries.length === 0
			? EVENT_LOG_PLACEHOLDER
			: eventLogEntries.join('\n')
}

const clearEventLog = () => {
	eventLogEntries = []
	renderEventLog()
}

const appendEventLog = entry => {
	if (!eventsOutput) return

	const isPinnedToBottom =
		!eventsScroller ||
		eventsScroller.scrollTop + eventsScroller.clientHeight >=
			eventsScroller.scrollHeight - 1

	eventLogEntries.push(entry)
	renderEventLog()

	if (isPinnedToBottom && eventsScroller) {
		eventsScroller.scrollTop = eventsScroller.scrollHeight
	}
}

const createPreviewItem = mode => {
	const wrapper = document.createElement('div')
	const label = document.createElement('h2')
	const content = sanitizeContentHtml(getValue('content'))

	wrapper.className = 'preview-item'

	if (mode === 'lite') {
		const marquee = document.createElement('div')
		const track = document.createElement('div')

		label.innerHTML = getShowModeLabelHtml(mode)
		track.className = 're-marquee__track'
		track.innerHTML = content
		applyLiteAttributes(marquee)
		marquee.append(track)
		wrapper.append(label, marquee)

		return wrapper
	}

	const marquee = document.createElement(mode)

	label.innerHTML = getShowModeLabelHtml(mode)
	marquee.innerHTML = content
	applyAttributes(marquee)
	attachMarqueeEventLogging(marquee, mode)
	wrapper.append(label, marquee)

	return wrapper
}

const getSettingEntries = () => {
	const entries = []

	for (const name of settingNames) {
		const value = readSetting(name)
		if (value === getDefaultValue(name)) continue
		if (!value && !getDefaultValue(name)) continue
		entries.push([name, value])
	}

	return entries
}

const applyLegacyShowSetting = value => {
	const showValue = String(value)

	writeSetting(
		'show-re-marquee',
		showValue === 're-marquee' || showValue === 'both' ? 'true' : 'false'
	)
	writeSetting('show-lite', showValue === 'lite' ? 'true' : 'false')
	writeSetting(
		'show-marquee',
		showValue === 'marquee' || showValue === 'both' ? 'true' : 'false'
	)
}

const writeStateToHash = () => {
	const params = new URLSearchParams(getSettingEntries())
	const url = new URL(window.location.href)

	url.hash = params.size === 0 ? '' : params.toString()

	window.history.replaceState(null, '', url)
}

const readStateFromHash = () => {
	const hash = window.location.hash.slice(1)
	if (!hash) return

	if (hash.startsWith('settings=')) {
		try {
			const raw = hash.slice('settings='.length)
			const state = JSON.parse(decodeURIComponent(raw))

			for (const [name, value] of Object.entries(state)) {
				if (name === 'show') {
					applyLegacyShowSetting(value)
					continue
				}
				const nextName = legacyShowModeNames[name] ?? name
				if (!settingNames.includes(nextName)) continue
				writeSetting(nextName, String(value))
			}
		} catch {
			window.history.replaceState(null, '', window.location.pathname)
		}

		return
	}

	const params = new URLSearchParams(hash)

	if (params.has('show')) {
		applyLegacyShowSetting(params.get('show') ?? '')
	}

	for (const name of settingNames) {
		const legacyName = Object.entries(legacyShowModeNames).find(
			([, nextName]) => nextName === name
		)?.[0]
		if (params.has(name)) {
			writeSetting(name, params.get(name) ?? '')
			continue
		}
		if (legacyName && params.has(legacyName)) {
			writeSetting(name, params.get(legacyName) ?? '')
		}
	}
}

const render = ({ syncHash = true } = {}) => {
	if (!form || !preview || !code) return

	syncShowCheckboxAvailability()
	syncSectionAvailability()
	clearEventLog()

	const modes = getSelectedShowModes()

	preview.replaceChildren(...modes.map(mode => createPreviewItem(mode)))

	const snippets = modes.map(mode =>
		mode === 'lite' ? getLiteCode() : getElementCode(mode)
	)
	const dependencies = getCodeDependencies(modes)
	const source = [dependencies, snippets.join('\n')]
		.filter(Boolean)
		.join('\n\n')

	code.textContent = source

	if (syncHash) {
		writeStateToHash()
	}
}

const setupColorInputs = () => {
	document.querySelectorAll('[data-color-hex]').forEach(hexInput => {
		if (!(hexInput instanceof HTMLInputElement) || !hexInput.name) return

		const colorInput = document.querySelector(
			`[data-color-picker="${hexInput.name}"]`
		)

		if (!(colorInput instanceof HTMLInputElement)) return

		const syncColorInput = () => {
			const normalized = normalizeHexColorValue(
				hexInput.value,
				stripHexColorPrefix(colorInput.value)
			)

			colorInput.value = `#${normalized || '000000'}`
		}

		colorInput.addEventListener('input', () => {
			hexInput.value = stripHexColorPrefix(colorInput.value).toLowerCase()
			render()
		})

		hexInput.addEventListener('input', () => {
			const hex = stripHexColorPrefix(hexInput.value)

			if (hex !== hexInput.value) {
				hexInput.value = hex
			}

			if (isHexColor(hex)) {
				colorInput.value = `#${normalizeHexColorValue(
					hex,
					stripHexColorPrefix(colorInput.value)
				)}`
			}
		})

		syncColorInput()
	})
}

const resetSettings = () => {
	if (!form) return

	form.reset()
	getControl('content').value = defaultValues.content
	syncPairedControls()
	setupColorInputs()
	syncShowCheckboxAvailability()
	render()
}

const togglePreviewFullscreen = async () => {
	if (!preview) return

	if (document.fullscreenElement) {
		await document.exitFullscreen()
		return
	}

	await preview.requestFullscreen()
}

form?.addEventListener('input', event => {
	syncPairedInput(event.target)
	render()
})
form?.addEventListener('change', event => {
	syncPairedInput(event.target)
	render()
})
form?.addEventListener('submit', event => {
	event.preventDefault()
})
if (form) {
	getControl('content').value = defaultValues.content
	readStateFromHash()
	syncPairedControls()
	setupColorInputs()
}
fullscreenButton?.addEventListener('click', async () => {
	await togglePreviewFullscreen()
})
resetButton?.addEventListener('click', () => {
	resetSettings()
})
preview?.addEventListener('dblclick', async event => {
	if (event.target !== preview) return

	await togglePreviewFullscreen()
})
document.addEventListener('fullscreenchange', () => {
	fullscreenButton?.setAttribute(
		'aria-pressed',
		String(Boolean(document.fullscreenElement))
	)
})
copyButton?.addEventListener('click', async () => {
	const source = code?.source
	if (!source) return

	await navigator.clipboard.writeText(source)
	copyButton.textContent = 'Copied'
	setTimeout(() => {
		copyButton.textContent = 'Copy'
	}, 1200)
})
render({ syncHash: false })
