import {
	parseLegacyColor,
	parsePresentationalDimension,
} from '../../src/lib/remarqueeble.ts'

describe('src/lib/remarqueeble.ts', () => {
	const originalCss = globalThis.CSS

	afterEach(() => {
		if (originalCss === undefined) {
			delete globalThis.CSS
			return
		}

		globalThis.CSS = originalCss
	})

	describe('parsePresentationalDimension()', () => {
		it('returns null for missing and blank values', () => {
			expect(parsePresentationalDimension(null)).toBeNull()
			expect(parsePresentationalDimension('')).toBeNull()
			expect(parsePresentationalDimension('  ')).toBeNull()
		})

		it('converts numeric values to px', () => {
			expect(parsePresentationalDimension('12')).toBe('12px')
			expect(parsePresentationalDimension('-4.5')).toBe('-4.5px')
			expect(parsePresentationalDimension('0')).toBe('0px')
		})

		it('returns supported CSS dimensions unchanged', () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'width' && value === 'calc(100% - 1rem)',
			}

			expect(parsePresentationalDimension('calc(100% - 1rem)')).toBe(
				'calc(100% - 1rem)'
			)
		})

		it('returns null for unsupported CSS dimensions', () => {
			globalThis.CSS = {
				supports: () => false,
			}

			expect(parsePresentationalDimension('definitely-not-a-size')).toBeNull()
		})
	})

	describe('parseLegacyColor()', () => {
		it('returns null for missing and blank values', () => {
			expect(parseLegacyColor(null)).toBeNull()
			expect(parseLegacyColor('')).toBeNull()
			expect(parseLegacyColor('  ')).toBeNull()
		})

		it('returns supported CSS colors unchanged', () => {
			globalThis.CSS = {
				supports: (property, value) =>
					property === 'background-color' && value === 'rebeccapurple',
			}

			expect(parseLegacyColor('rebeccapurple')).toBe('rebeccapurple')
		})

		it('returns null for unsupported CSS colors', () => {
			globalThis.CSS = {
				supports: () => false,
			}

			expect(parseLegacyColor('not-a-color')).toBeNull()
		})
	})
})
