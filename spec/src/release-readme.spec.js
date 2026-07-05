import { updateReadmeVersion } from '../../bin/release-readme.mjs'

describe('bin/release-readme.mjs', () => {
	const readme = `# <mark aria-label="Remarqueeble">&lt;re-marquee&gt;ble</mark>

A tiny custom element tribute.

By Rémino Rem

<script src="https://unpkg.com/remarqueeble"></script>

- https://unpkg.com/remarqueeble
- https://cdn.jsdelivr.net/npm/remarqueeble

<script src="https://unpkg.com/remarqueeble@0.3.0"></script>

import { defineRemarqueebleElements } from 'https://unpkg.com/remarqueeble@0.3.0/dist/remarqueeble.mjs'
`

	it('adds the visible README version line', () => {
		const next = updateReadmeVersion(readme, '0.5.0')

		expect(next).toContain('Remarqueeble v0.5.0\n\nBy Rémino Rem')
	})

	it('updates an existing visible README version line', () => {
		const next = updateReadmeVersion(
			readme.replace('By Rémino Rem', 'Remarqueeble v0.4.0\n\nBy Rémino Rem'),
			'0.5.0'
		)

		expect(next).toContain('Remarqueeble v0.5.0\n\nBy Rémino Rem')
		expect(next).not.toContain('Remarqueeble v0.4.0')
	})

	it('updates pinned CDN examples', () => {
		const next = updateReadmeVersion(readme, '0.5.0')

		expect(next).toContain('https://unpkg.com/remarqueeble@0.5.0')
		expect(next).toContain(
			'https://unpkg.com/remarqueeble@0.5.0/dist/remarqueeble.mjs'
		)
		expect(next).not.toContain('remarqueeble@0.3.0')
	})

	it('leaves unpinned CDN URLs unchanged', () => {
		const next = updateReadmeVersion(readme, '0.5.0')

		expect(next).toContain('https://unpkg.com/remarqueeble"></script>')
		expect(next).toContain('- https://unpkg.com/remarqueeble')
		expect(next).toContain('- https://cdn.jsdelivr.net/npm/remarqueeble')
	})

	it('fails when expected pinned URLs are missing', () => {
		expect(() =>
			updateReadmeVersion(
				readme.replaceAll('https://unpkg.com/remarqueeble@0.3.0', ''),
				'0.5.0'
			)
		).toThrowError('Expected to update 2 pinned README CDN URLs, updated 0.')
	})
})
