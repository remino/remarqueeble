describe('src/lib/auto.ts', () => {
	const originalCustomElements = globalThis.customElements
	const originalHTMLElement = globalThis.HTMLElement

	afterEach(() => {
		if (originalCustomElements === undefined) {
			delete globalThis.customElements
		} else {
			globalThis.customElements = originalCustomElements
		}

		if (originalHTMLElement === undefined) {
			delete globalThis.HTMLElement
		} else {
			globalThis.HTMLElement = originalHTMLElement
		}
	})

	it('registers both custom elements on import', async () => {
		const registered = []

		globalThis.HTMLElement = class {}
		globalThis.customElements = {
			define(name, constructor) {
				registered.push([name, constructor])
			},
			get() {
				return undefined
			},
		}

		await import(`../../src/lib/auto.ts?auto-spec=${Date.now()}`)

		expect(registered.map(([name]) => name)).toEqual([
			're-marquee',
			're-marquee-ble',
		])
		expect(registered[0][1]).toBe(registered[1][1])
	})
})
