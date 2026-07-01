const form = document.querySelector('[data-playground]')
const display = document.querySelector('#playground-display')
const preview = document.querySelector('[data-preview]')
const code = document.querySelector('[data-code]')
const copyButton = document.querySelector('[data-copy]')
const fullscreenButton = document.querySelector('[data-fullscreen]')
const defaultValues = {
	behavior: 'scroll',
	content:
		'Default marquee behaviour. Nisi nisi anim enim consequat pariatur reprehenderit.',
	direction: 'left',
	scrollamount: '6',
	scrolldelay: '85',
	show: 're-marquee',
	truespeed: 'false',
	width: '100%',
}
const textAttributes = [
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
const settingNames = ['show', ...textAttributes, 'truespeed', 'content']

const escapeHtml = value =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const escapeAttribute = value => escapeHtml(value).replaceAll('"', '&quot;')

const getControl = name => form?.elements.namedItem(name)

const getValue = name => getControl(name)?.value ?? ''

const getDefaultValue = name => defaultValues[name] ?? ''

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

const syncPairedInput = target => {
	if (!(target instanceof HTMLInputElement)) return

	if (target.name === 'scrollamountRange') {
		getControl('scrollamount').value = target.value
	}

	if (target.name === 'scrollamount') {
		getControl('scrollamountRange').value = target.value
	}

	if (target.name === 'scrolldelayRange') {
		getControl('scrolldelay').value = target.value
	}

	if (target.name === 'scrolldelay') {
		getControl('scrolldelayRange').value = target.value
	}
}

const syncPairedControls = () => {
	getControl('scrollamountRange').value = getValue('scrollamount')
	getControl('scrolldelayRange').value = getValue('scrolldelay')
}

const getAttributes = () => {
	const attributes = []

	for (const name of textAttributes) {
		const value = getValue(name).trim()
		if (!value) continue
		if (getDefaultValue(name) === value) continue
		attributes.push([name, value])
	}

	if (getControl('truespeed')?.checked) {
		attributes.push(['truespeed', ''])
	}

	return attributes
}

const getCode = tagName => {
	const attributes = getAttributes()
		.map(([name, value]) =>
			value ? `${name}="${escapeAttribute(value)}"` : name
		)
		.join(' ')
	const openTag = attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`
	const content = escapeHtml(getValue('content').trim())

	return `${openTag}${content}</${tagName}>`
}

const applyAttributes = element => {
	for (const [name, value] of getAttributes()) {
		if (value) {
			element.setAttribute(name, value)
		} else {
			element.setAttribute(name, '')
		}
	}
}

const createPreviewItem = tagName => {
	const wrapper = document.createElement('div')
	const label = document.createElement('h2')
	const marquee = document.createElement(tagName)

	wrapper.className = 'preview-item'
	label.innerHTML = `<code>&lt;${tagName}&gt;</code>`
	marquee.textContent = getValue('content')
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
				if (!settingNames.includes(name)) continue
				writeSetting(name, String(value))
			}
		} catch {
			window.history.replaceState(null, '', window.location.pathname)
		}

		return
	}

	const params = new URLSearchParams(hash)

	for (const name of settingNames) {
		if (!params.has(name)) continue
		writeSetting(name, params.get(name) ?? '')
	}
}

const render = ({ syncHash = true } = {}) => {
	if (!form || !preview || !code) return

	const show = getValue('show')
	const tagNames =
		show === 'both' ? ['re-marquee', 'marquee'] : [show || 're-marquee']

	preview.replaceChildren(
		...tagNames.map(tagName => createPreviewItem(tagName))
	)
	code.value = tagNames.map(tagName => getCode(tagName)).join('\n')

	if (syncHash) {
		writeStateToHash()
	}
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
}
fullscreenButton?.addEventListener('click', async () => {
	if (!display) return

	if (document.fullscreenElement) {
		await document.exitFullscreen()
		return
	}

	await display.requestFullscreen()
})
document.addEventListener('fullscreenchange', () => {
	fullscreenButton?.setAttribute(
		'aria-pressed',
		String(Boolean(document.fullscreenElement))
	)
})
copyButton?.addEventListener('click', async () => {
	if (!code?.value) return

	await navigator.clipboard.writeText(code.value)
	copyButton.textContent = 'Copied'
	setTimeout(() => {
		copyButton.textContent = 'Copy'
	}, 1200)
})
render({ syncHash: false })
