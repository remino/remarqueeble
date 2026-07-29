import DOMPurify from 'dompurify'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import html from 'shiki/langs/html.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'

const form = document.querySelector('[data-playground]')
const preview = document.querySelector('[data-preview]')
const code = document.querySelector('code-viewer')
const copyButton = document.querySelector('[data-copy]')
const fullscreenButton = document.querySelector('[data-fullscreen]')
const resetButton = document.querySelector('[data-reset]')
const CODE_VIEWER_TAG_NAME = 'code-viewer'
const showModeControls = [
	['showReMarquee', 're-marquee'],
	['showLite', 'lite'],
	['showMarquee', 'marquee'],
]
const defaultValues = {
	animate: 'always',
	behavior: 'scroll',
	content:
		'Default marquee behaviour. Nisi nisi anim enim consequat pariatur reprehenderit.',
	direction: 'left',
	duration: '',
	scrollamount: '6',
	scrolldelay: '85',
	showLite: 'false',
	showMarquee: 'false',
	showReMarquee: 'true',
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
		value =>
			value && CSS.supports('animation-duration', value.trim())
				? value.trim()
				: '',
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

const syncShowCheckboxAvailability = () => {
	const selectedModes = getSelectedShowModes()

	if (selectedModes.length === 0) {
		writeSetting('showReMarquee', 'true')
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
}

const syncPairedControls = () => {
	syncRangeValue('scrollamountRange', getValue('scrollamount'))
	getControl('scrolldelayRange').value = getValue('scrolldelay')
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
	[...getLiteStyleDeclarations(), ...getStyleDeclarations()]
		.map(([property, value]) => `${property}: ${value}`)
		.join('; ')

const getElementCode = tagName => {
	const attributes = [
		...getAttributes(),
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
	for (const [name, value] of getAttributes()) {
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
		...getStyleDeclarations(),
	]) {
		element.style.setProperty(property, value)
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

		label.innerHTML = `<code>lite.css</code>`
		track.className = 're-marquee__track'
		track.innerHTML = content
		applyLiteAttributes(marquee)
		marquee.append(track)
		wrapper.append(label, marquee)

		return wrapper
	}

	const marquee = document.createElement(mode)

	label.innerHTML = `<code>&lt;${mode}&gt;</code>`
	marquee.innerHTML = content
	applyAttributes(marquee)
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
		'showReMarquee',
		showValue === 're-marquee' || showValue === 'both' ? 'true' : 'false'
	)
	writeSetting('showLite', showValue === 'lite' ? 'true' : 'false')
	writeSetting(
		'showMarquee',
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
				if (!settingNames.includes(name)) continue
				writeSetting(name, String(value))
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
		if (!params.has(name)) continue
		writeSetting(name, params.get(name) ?? '')
	}
}

const render = ({ syncHash = true } = {}) => {
	if (!form || !preview || !code) return

	syncShowCheckboxAvailability()

	const modes = getSelectedShowModes()

	preview.replaceChildren(...modes.map(mode => createPreviewItem(mode)))

	const source = modes
		.map(mode => (mode === 'lite' ? getLiteCode() : getElementCode(mode)))
		.join('\n')

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
